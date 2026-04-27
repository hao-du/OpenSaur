using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Infrastructure.Auth;

public static class AppAuthorization
{
    public const string SuperAdminOnlyPolicyName = "SuperAdminOnly";
    public const string AdminCanManagePolicyName = "AdminCanManagePolicyName";
    public const string AdminCanManageOrSuperAdminPolicyName = "AdminCanManageOrSuperAdminPolicyName";

    public static void ConfigurePolicies(AuthorizationOptions options)
    {
        options.AddPolicy(
            SuperAdminOnlyPolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.IsSuperAdministrator(context.User));
            });

        options.AddPolicy(
            AdminCanManagePolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.HasPermission(context.User, Constants.Permissions.Administration.CanManage));
            });

        options.AddPolicy(
            AdminCanManageOrSuperAdminPolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.HasPermission(context.User, Constants.Permissions.Administration.CanManage) || ClaimHelper.IsSuperAdministrator(context.User));
            });
    }
}
