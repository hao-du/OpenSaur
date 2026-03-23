using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.Identity.Web.Infrastructure.Resilience.Idempotency;

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

    public IdempotencyMiddleware(RequestDelegate next, EndpointResilienceOptions options)
    {
        _next = next;
        _options = options;
    }

    public async Task InvokeAsync(
        HttpContext httpContext,
        HybridCache cache,
        IdempotencyRequestLockProvider lockProvider)
    {
        if (!EndpointResiliencePolicySelector.RequiresIdempotency(httpContext))
        {
            await _next(httpContext);
            return;
        }

        var headerName = _options.Idempotency.HeaderName;
        if (!httpContext.Request.Headers.TryGetValue(headerName, out var idempotencyKeyValues)
            || string.IsNullOrWhiteSpace(idempotencyKeyValues.ToString()))
        {
            await Results.ValidationProblem(
                    new Dictionary<string, string[]>
                    {
                        [headerName] = ["The idempotency key header is required for this endpoint."]
                    })
                .ExecuteAsync(httpContext);
            return;
        }

        var idempotencyKey = idempotencyKeyValues.ToString();
        var callerScope = EndpointResilienceCallerScope.GetPartitionKey(httpContext);
        var endpointScopeKey = EndpointResiliencePolicySelector.GetEndpointScopeKey(httpContext);
        var fingerprint = await ComputeFingerprintAsync(httpContext, callerScope);
        var cacheKey = $"idempotency:{callerScope}:{endpointScopeKey}:{idempotencyKey}";
        var entryOptions = new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromMinutes(_options.Idempotency.ReplayRetentionMinutes),
            LocalCacheExpiration = TimeSpan.FromMinutes(_options.Idempotency.ReplayRetentionMinutes)
        };

        await using var idempotencyLock = await lockProvider.AcquireAsync(cacheKey, httpContext.RequestAborted);
        var existingEntry = await cache.TryGetAsync<IdempotencyCacheEntry>(cacheKey, httpContext.RequestAborted);
        if (existingEntry is { Found: true, Value: not null })
        {
            if (!string.Equals(existingEntry.Value.RequestFingerprint, fingerprint, StringComparison.Ordinal))
            {
                await Results.Problem(
                        title: "Idempotency key reuse conflict.",
                        detail: "The supplied idempotency key was already used with a different request payload.",
                        statusCode: StatusCodes.Status409Conflict)
                    .ExecuteAsync(httpContext);
                return;
            }

            await ReplayStoredResponseAsync(httpContext, existingEntry.Value);
            return;
        }

        var originalResponseBody = httpContext.Response.Body;
        await using var responseBuffer = new MemoryStream();
        httpContext.Response.Body = responseBuffer;

        try
        {
            await _next(httpContext);

            responseBuffer.Position = 0;
            var responseBytes = responseBuffer.ToArray();

            httpContext.Response.Body = originalResponseBody;
            if (responseBytes.Length > 0)
            {
                await originalResponseBody.WriteAsync(responseBytes, httpContext.RequestAborted);
            }

            if (!ShouldPersist(httpContext.Response.StatusCode))
            {
                return;
            }

            var responseEntry = new IdempotencyCacheEntry(
                fingerprint,
                httpContext.Response.StatusCode,
                httpContext.Response.ContentType,
                IdempotencyCacheEntry.CreateHeaders(httpContext.Response.Headers, IgnoredHeaders),
                responseBytes);

            await cache.SetAsync(
                cacheKey,
                responseEntry,
                entryOptions,
                cancellationToken: httpContext.RequestAborted);
        }
        finally
        {
            httpContext.Response.Body = originalResponseBody;
        }
    }

    private static async Task<string> ComputeFingerprintAsync(HttpContext httpContext, string callerScope)
    {
        httpContext.Request.EnableBuffering();

        await using var bodyBuffer = new MemoryStream();
        await httpContext.Request.Body.CopyToAsync(bodyBuffer, httpContext.RequestAborted);
        var bodyBytes = bodyBuffer.ToArray();
        httpContext.Request.Body.Position = 0;

        var prefix = Encoding.UTF8.GetBytes(
            $"{httpContext.Request.Method}\n{httpContext.Request.Path.Value}\n{httpContext.Request.ContentType}\n{callerScope}\n");
        var payload = new byte[prefix.Length + bodyBytes.Length];
        Buffer.BlockCopy(prefix, 0, payload, 0, prefix.Length);
        Buffer.BlockCopy(bodyBytes, 0, payload, prefix.Length, bodyBytes.Length);

        return Convert.ToHexString(SHA256.HashData(payload));
    }

    private static async Task ReplayStoredResponseAsync(HttpContext httpContext, IdempotencyCacheEntry record)
    {
        httpContext.Response.StatusCode = record.StatusCode;
        httpContext.Response.Headers.Clear();

        if (!string.IsNullOrWhiteSpace(record.ContentType))
        {
            httpContext.Response.ContentType = record.ContentType;
        }

        foreach (var (key, values) in record.ResponseHeaders)
        {
            httpContext.Response.Headers.Append(key, values);
        }

        if (record.ResponseBody.Length > 0)
        {
            httpContext.Response.ContentLength = record.ResponseBody.Length;
            await httpContext.Response.Body.WriteAsync(record.ResponseBody, httpContext.RequestAborted);
        }
    }

    private static bool ShouldPersist(int statusCode)
    {
        return statusCode < StatusCodes.Status500InternalServerError
               && statusCode != StatusCodes.Status429TooManyRequests;
    }
}
