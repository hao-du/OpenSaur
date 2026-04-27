using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Claims;
using CoreGateClaimTypes = OpenSaur.CoreGate.Web.Infrastructure.Security.ClaimTypes;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public class ClaimService(
    ApplicationDbContext dbContext,
    UserRolePermissionService authorizationDataService,
    UserRolePermissionService userRolePermissionService,
    UserManager<ApplicationUser> userManager
)
{
    public async Task<ClaimsPrincipal?> BuildUserClaimPrincipalAsync(
        ClaimsPrincipal sourcePrincipal,
        IEnumerable<string> requestedScopes,
        string? impersonatedUserId,
        string? workspaceId,
        CancellationToken cancellationToken
    )
    {
        var originalUserId = sourcePrincipal.FindFirstValue(CoreGateClaimTypes.ImpersonationOriginalUserId);
        var userId = !string.IsNullOrWhiteSpace(impersonatedUserId)
            ? impersonatedUserId
            : ClaimPrincipalHelpers.GetUserId(sourcePrincipal);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(impersonatedUserId))
        {
            originalUserId = ClaimPrincipalHelpers.GetUserId(sourcePrincipal);
            if (!Guid.TryParse(originalUserId, out var actorUserId)
                || !await userRolePermissionService.CanImpersonateAsync(actorUserId, cancellationToken))
            {
                return null;
            }
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        Guid assignedWorkspaceId = Guid.Empty;
        if (!string.IsNullOrWhiteSpace(workspaceId))
        {
            assignedWorkspaceId = Guid.Parse(workspaceId);
        }
        else if (!string.IsNullOrWhiteSpace(ClaimPrincipalHelpers.GetWorkspaceId(sourcePrincipal)))
        {
            assignedWorkspaceId = Guid.Parse(ClaimPrincipalHelpers.GetWorkspaceId(sourcePrincipal)!);
        }
        else
        {
            assignedWorkspaceId = user.WorkspaceId;
        }
        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(workspace => workspace.Id == assignedWorkspaceId && workspace.IsActive, cancellationToken);
        if (workspace is null)
        {
            return null;
        }

        var roles = await authorizationDataService.GetActiveNormalizedRoleNamesForUserAsync(user.Id, workspace.Id, cancellationToken);
        var permissions = await authorizationDataService.GetGrantedPermissionCodesAsync(user.Id, workspace.Id, cancellationToken);

        return ClaimPrincipalHelpers.Create(user, roles, permissions, requestedScopes, originalUserId, assignedWorkspaceId.ToString());
    }
}
