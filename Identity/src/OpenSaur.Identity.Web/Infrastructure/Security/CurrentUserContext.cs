using System.Reflection;
using System.Security.Claims;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed record CurrentUserContext(Guid UserId, Guid WorkspaceId, bool IsSuperAdministrator)
{
    public static CurrentUserContext? Create(ClaimsPrincipal principal)
    {
        var userId = principal.FindFirstValue(ApplicationClaimTypes.Subject)
                     ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
        var workspaceId = principal.FindFirstValue(ApplicationClaimTypes.WorkspaceId);
        if (!Guid.TryParse(userId, out var parsedUserId)
            || !Guid.TryParse(workspaceId, out var parsedWorkspaceId))
        {
            return null;
        }

        return new CurrentUserContext(
            parsedUserId,
            parsedWorkspaceId,
            principal.FindAll(ApplicationClaimTypes.Role)
                .Any(claim => string.Equals(claim.Value, SystemRoles.SuperAdministrator, StringComparison.Ordinal)));
    }

    public static ValueTask<CurrentUserContext?> BindAsync(HttpContext httpContext, ParameterInfo _)
    {
        return ValueTask.FromResult(Create(httpContext.User));
    }
}
