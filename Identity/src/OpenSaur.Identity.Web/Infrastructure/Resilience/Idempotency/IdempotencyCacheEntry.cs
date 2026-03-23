namespace OpenSaur.Identity.Web.Infrastructure.Resilience.Idempotency;

public sealed record IdempotencyCacheEntry(
    string RequestFingerprint,
    int StatusCode,
    string? ContentType,
    Dictionary<string, string[]> ResponseHeaders,
    byte[] ResponseBody)
{
    public static Dictionary<string, string[]> CreateHeaders(IHeaderDictionary headers, ISet<string> ignoredHeaders)
    {
        return headers
            .Where(header => !ignoredHeaders.Contains(header.Key))
            .ToDictionary(
                header => header.Key,
                header => header.Value.Select(static value => value ?? string.Empty).ToArray(),
                StringComparer.OrdinalIgnoreCase);
    }
}
