using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Infrastructure.Auth;

public static class AppAuthorization
{
    public const string SuperAdminOnlyPolicyName = "SuperAdminOnly";
    public const string CashPilotCanManagePolicyName = "CashPilotCanManagePolicyName";
    public const string CashPilotCanManageOrSuperAdminPolicyName = "CashPilotCanManageOrSuperAdminPolicyName";

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
            CashPilotCanManagePolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.HasPermission(context.User, Constants.Permissions.CashPilot.CanManage));
            });

        options.AddPolicy(
            CashPilotCanManageOrSuperAdminPolicyName,
            policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireAssertion(context => ClaimHelper.HasPermission(context.User, Constants.Permissions.CashPilot.CanManage) || ClaimHelper.IsSuperAdministrator(context.User));
            });
    }
}
