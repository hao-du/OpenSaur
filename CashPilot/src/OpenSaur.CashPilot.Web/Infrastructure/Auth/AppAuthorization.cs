using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Infrastructure.Auth;

public static class AppAuthorization
{
    public const string CanAccessPolicyName = "CanAccessPolicyName";

    public static void ConfigurePolicies(AuthorizationOptions options)
    {
        options.AddPolicy(
            CanAccessPolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.HasPermission(context.User, Constants.Permissions.CashPilot.CanManage) || ClaimHelper.IsSuperAdministrator(context.User));
            });
    }
}
