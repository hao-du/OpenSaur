namespace OpenSaur.Identity.Web.Domain.Identity;

public static class SystemRoles
{
    public const string SuperAdministrator = "Super Administrator";
    public const string NormalizedSuperAdministrator = "SUPERADMINISTRATOR";

    public static string Normalize(string? roleValue)
    {
        if (string.IsNullOrWhiteSpace(roleValue))
        {
            return string.Empty;
        }

        return string.Concat(
            roleValue
                .Trim()
                .Where(char.IsLetterOrDigit))
            .ToUpperInvariant();
    }

    public static bool IsSuperAdministratorValue(string? roleValue)
    {
        return string.Equals(Normalize(roleValue), NormalizedSuperAdministrator, StringComparison.Ordinal);
    }
}
