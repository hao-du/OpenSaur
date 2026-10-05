using System.Security.Claims;

namespace OpenSaur.Brainbubby.Web.Infrastructure.Security;

public interface IClaimService
{
    CurrentUserContext GetUserContext(ClaimsPrincipal principal);
    Guid? GetUserId(ClaimsPrincipal principal);
    string? GetEmail(ClaimsPrincipal principal);
    Guid? GetWorkspaceId(ClaimsPrincipal principal);
    bool IsSuperAdministrator(ClaimsPrincipal principal);
    IReadOnlyList<string> GetRoles(ClaimsPrincipal principal);
    IReadOnlyList<string> GetPermissions(ClaimsPrincipal principal);
}
