using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenSaur.Zentry.Web.Infrastructure;

namespace OpenSaur.Zentry.Web.Infrastructure.Auth;

public static class SuperAdminAuthorization
{
    public const string PolicyName = "SuperAdminOnly";
    private const string RoleClaimType = "roles";

    public static void ConfigurePolicy(AuthorizationOptions options)
    {
        options.AddPolicy(
            PolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => IsSuperAdministrator(context.User));
            });
    }

    public static bool IsSuperAdministrator(ClaimsPrincipal user)
    {
        return user.FindAll(RoleClaimType)
            .Any(claim => string.Equals(Normalize(claim.Value), Constants.NormalizedSuperAdministrator, StringComparison.Ordinal));
    }

    private static string Normalize(string? roleValue)
    {
        if (string.IsNullOrWhiteSpace(roleValue))
        {
            return string.Empty;
        }

        return string.Concat(roleValue.Trim().Where(char.IsLetterOrDigit)).ToUpperInvariant();
    }
}
