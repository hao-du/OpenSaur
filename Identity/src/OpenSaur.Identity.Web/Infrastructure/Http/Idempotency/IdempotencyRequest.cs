using System.Security.Cryptography;
using System.Text;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed record IdempotencyRequest(
    // Full cache key combining caller scope, endpoint identity, and the client-supplied idempotency key.
    string CacheKey,
    // Stable hash of the request so key reuse with a different payload can be rejected.
    string Fingerprint,
    // How long the replay entry should remain in cache.
    TimeSpan ReplayRetention)
{
    public static async Task<IdempotencyRequest?> TryCreateAsync(
        HttpContext httpContext,
        EndpointResilienceContext resilienceContext,
        EndpointIdempotencyOptions options)
    {
        // Build the request-specific idempotency data only when the configured header is present.
        if (!httpContext.Request.Headers.TryGetValue(options.HeaderName, out var idempotencyKeyValues)
            || string.IsNullOrWhiteSpace(idempotencyKeyValues.ToString()))
        {
            return null;
        }

        var key = idempotencyKeyValues.ToString();
        var fingerprint = await ComputeFingerprintAsync(httpContext, resilienceContext.CallerScopeKey);
        // Caller scope is part of the cache key so two different users can safely reuse the same idempotency key value.
        var cacheKey = $"idempotency:{resilienceContext.CallerScopeKey}:{resilienceContext.EndpointKey}:{key}";

        return new IdempotencyRequest(
            cacheKey,
            fingerprint,
            TimeSpan.FromMinutes(options.ReplayRetentionMinutes));
    }

    private static async Task<string> ComputeFingerprintAsync(HttpContext httpContext, string callerScope)
    {
        // The fingerprint ties the idempotency key to the caller and request payload so mismatched retries can be rejected.
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
}
