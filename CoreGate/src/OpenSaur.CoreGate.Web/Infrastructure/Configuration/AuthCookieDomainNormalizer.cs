namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public static class AuthCookieDomainNormalizer
{
    public static bool IsValid(string? configuredDomain)
    {
        if (string.IsNullOrWhiteSpace(configuredDomain))
        {
            return true;
        }

        var domain = configuredDomain.Trim();
        if (domain.Contains(' ') || domain.EndsWith(".", StringComparison.Ordinal) || domain.Contains("..", StringComparison.Ordinal))
        {
            return false;
        }

        var firstWildcardIndex = domain.IndexOf('*', StringComparison.Ordinal);
        if (firstWildcardIndex < 0)
        {
            return true;
        }

        return firstWildcardIndex == 0
            && domain.StartsWith("*.", StringComparison.Ordinal)
            && domain.LastIndexOf('*') == 0
            && domain.Length > 2;
    }

    public static string? Normalize(string? configuredDomain)
    {
        if (string.IsNullOrWhiteSpace(configuredDomain))
        {
            return null;
        }

        var domain = configuredDomain.Trim();
        if (domain.StartsWith("*.", StringComparison.Ordinal))
        {
            // RFC 6265 cookies do not support wildcard token, use parent domain.
            return domain[1..];
        }

        return domain;
    }
}
