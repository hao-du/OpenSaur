using OpenSaur.Identity.Web.Infrastructure.Http.Configuration;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed class IdempotencyMiddleware
{
    private static readonly HashSet<string> IgnoredHeaders =
    [
        "Content-Length",
        "Date",
        "Server",
        "Transfer-Encoding"
    ];

    private readonly RequestDelegate _next;
    private readonly EndpointResilienceOptions _options;
    private readonly EndpointResilienceContextResolver _contextResolver;

    public IdempotencyMiddleware(
        RequestDelegate next,
        EndpointResilienceOptions options,
        EndpointResilienceContextResolver contextResolver)
    {
        _next = next;
        _options = options;
        _contextResolver = contextResolver;
    }

    public async Task InvokeAsync(
        HttpContext httpContext,
        IdempotencyCacheStore cacheStore,
        IdempotencyRequestLockProvider lockProvider)
    {
        // Entry point for all requests. It opts in only for endpoints annotated with idempotency metadata.
        var resilienceContext = _contextResolver.Resolve(httpContext);
        if (!resilienceContext.RequiresIdempotency)
        {
            await _next(httpContext);
            return;
        }

        var request = await IdempotencyRequest.TryCreateAsync(
            httpContext,
            resilienceContext,
            _options.Idempotency);
        if (request is null)
        {
            await WriteMissingKeyResponseAsync(httpContext, _options.Idempotency.HeaderName);
            return;
        }

        // In-process lock: only one request with the same idempotency cache key executes at a time on this app instance.
        await using var idempotencyLock = await lockProvider.AcquireAsync(request.CacheKey, httpContext.RequestAborted);
        var existingEntry = await cacheStore.GetAsync(request.CacheKey, httpContext.RequestAborted);
        if (existingEntry is not null)
        {
            await HandleStoredEntryAsync(httpContext, request, existingEntry);
            return;
        }

        await ExecuteAndStoreResponseAsync(httpContext, request, cacheStore);
    }

    private async Task HandleStoredEntryAsync(
        HttpContext httpContext,
        IdempotencyRequest request,
        IdempotencyCacheEntry storedEntry)
    {
        // A repeated key is only valid when the request fingerprint matches the original request.
        if (!string.Equals(storedEntry.RequestFingerprint, request.Fingerprint, StringComparison.Ordinal))
        {
            await WriteConflictResponseAsync(httpContext);
            return;
        }

        // Full-response replay: return the original status, headers, content type, and body without re-running the endpoint.
        await ReplayStoredResponseAsync(httpContext, storedEntry);
    }

    private async Task ExecuteAndStoreResponseAsync(
        HttpContext httpContext,
        IdempotencyRequest request,
        IdempotencyCacheStore cacheStore)
    {
        // Buffer the response so we can both return it to the caller and persist a replayable copy.
        var originalResponseBody = httpContext.Response.Body;
        await using var responseBuffer = new MemoryStream();
        httpContext.Response.Body = responseBuffer;

        try
        {
            await _next(httpContext);

            var responseEntry = await CaptureResponseAsync(httpContext, request, responseBuffer, originalResponseBody);
            if (responseEntry is null)
            {
                return;
            }

            await cacheStore.SetAsync(
                request.CacheKey,
                responseEntry,
                request.ReplayRetention,
                httpContext.RequestAborted);
        }
        finally
        {
            httpContext.Response.Body = originalResponseBody;
        }
    }

    private static async Task<IdempotencyCacheEntry?> CaptureResponseAsync(
        HttpContext httpContext,
        IdempotencyRequest request,
        MemoryStream responseBuffer,
        Stream originalResponseBody)
    {
        // Convert the buffered response into a cache entry after writing the same bytes back to the real response stream.
        responseBuffer.Position = 0;
        var responseBytes = responseBuffer.ToArray();

        if (responseBytes.Length > 0)
        {
            await originalResponseBody.WriteAsync(responseBytes, httpContext.RequestAborted);
        }

        if (!ShouldPersist(httpContext.Response.StatusCode))
        {
            return null;
        }

        // We persist a replayable HTTP response entry here, not just a successful JSON/value object.
        return new IdempotencyCacheEntry(
            RequestFingerprint: request.Fingerprint,
            StatusCode: httpContext.Response.StatusCode,
            ContentType: httpContext.Response.ContentType,
            ResponseHeaders: IdempotencyCacheEntry.CreateHeaders(httpContext.Response.Headers, IgnoredHeaders),
            ResponseBody: responseBytes);
    }

    private static async Task ReplayStoredResponseAsync(HttpContext httpContext, IdempotencyCacheEntry response)
    {
        // Rebuild the original HTTP response shape from the cached entry without executing the endpoint again.
        httpContext.Response.StatusCode = response.StatusCode;
        httpContext.Response.Headers.Clear();

        if (!string.IsNullOrWhiteSpace(response.ContentType))
        {
            httpContext.Response.ContentType = response.ContentType;
        }

        foreach (var (key, values) in response.ResponseHeaders)
        {
            httpContext.Response.Headers.Append(key, values);
        }

        if (response.ResponseBody.Length > 0)
        {
            httpContext.Response.ContentLength = response.ResponseBody.Length;
            await httpContext.Response.Body.WriteAsync(response.ResponseBody, httpContext.RequestAborted);
        }
    }

    private static Task WriteMissingKeyResponseAsync(HttpContext httpContext, string headerName)
    {
        // Selected write endpoints require an explicit Idempotency-Key so retries are intentional and traceable.
        return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    [headerName] = ["The idempotency key header is required for this endpoint."]
                })
            .ExecuteAsync(httpContext);
    }

    private static Task WriteConflictResponseAsync(HttpContext httpContext)
    {
        // Reusing the same key for a different payload is treated as a client error instead of a new write.
        return Results.Problem(
                title: "Idempotency key reuse conflict.",
                detail: "The supplied idempotency key was already used with a different request payload.",
                statusCode: StatusCodes.Status409Conflict)
            .ExecuteAsync(httpContext);
    }

    private static bool ShouldPersist(int statusCode)
    {
        // Simpler implementations often cache only successful JSON/value results.
        // This implementation caches replay-safe HTTP responses instead: no 5xx failures and no 429 rate-limit responses.
        return statusCode < StatusCodes.Status500InternalServerError
               && statusCode != StatusCodes.Status429TooManyRequests;
    }
}
