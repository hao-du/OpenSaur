using System.Security.Claims;
using OpenSaur.RuleAgent.Web.Features.Auth;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Security;

public sealed class ClaimService : IClaimService
{
    public CurrentUserContext GetUserContext(ClaimsPrincipal principal)
    {
        return new CurrentUserContext(
            UserId: GetUserId(principal),
            Email: GetEmail(principal),
            WorkspaceId: GetWorkspaceId(principal),
            IsSuperAdministrator: IsSuperAdministrator(principal),
            Roles: GetRoles(principal),
            Permissions: GetPermissions(principal));
    }

    public Guid? GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        return Guid.TryParse(sub, out var userId) ? userId : null;
    }

    public string? GetEmail(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Email)
            ?? principal.FindFirstValue("email");
    }

    public Guid? GetWorkspaceId(ClaimsPrincipal principal)
    {
        var workspaceIdValue = principal.FindFirstValue("workspace_id")
            ?? principal.FindFirstValue("workspaceId");

        return Guid.TryParse(workspaceIdValue, out var workspaceId) ? workspaceId : null;
    }

    public bool IsSuperAdministrator(ClaimsPrincipal principal)
    {
        return GetRoles(principal).Any(r => string.Equals(r, AuthConstants.Roles.SuperAdministrator, StringComparison.OrdinalIgnoreCase));
    }

    public IReadOnlyList<string> GetRoles(ClaimsPrincipal principal)
    {
        return principal.FindAll(ClaimTypes.Role)
            .Concat(principal.FindAll("role"))
            .Concat(principal.FindAll("roles"))
            .Select(c => c.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public IReadOnlyList<string> GetPermissions(ClaimsPrincipal principal)
    {
        return principal.FindAll("permission")
            .Concat(principal.FindAll("permissions"))
            .Select(c => c.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
