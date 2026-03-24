namespace OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;

public sealed record IdempotencyCacheEntry(
    // The original request fingerprint paired with this cached response.
    string RequestFingerprint,
    // HTTP status returned by the first completed request.
    int StatusCode,
    // Content type needed to reconstruct the same HTTP response.
    string? ContentType,
    // Response headers safe to replay for duplicates.
    Dictionary<string, string[]> ResponseHeaders,
    // Raw response body bytes from the first completed request.
    byte[] ResponseBody)
{
    public static Dictionary<string, string[]> CreateHeaders(IHeaderDictionary headers, ISet<string> ignoredHeaders)
    {
        // These headers are part of full-response replay; transient transport headers are intentionally excluded.
        return headers
            .Where(header => !ignoredHeaders.Contains(header.Key))
            .ToDictionary(
                header => header.Key,
                header => header.Value.Select(static value => value ?? string.Empty).ToArray(),
                StringComparer.OrdinalIgnoreCase);
    }
}
