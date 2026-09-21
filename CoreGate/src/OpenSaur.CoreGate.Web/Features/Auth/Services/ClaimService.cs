using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Domain.Workspaces;
using OpenSaur.CoreGate.Web.Infrastructure.Caching;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Claims;
using CoreGateClaimTypes = OpenSaur.CoreGate.Web.Infrastructure.Security.ClaimTypes;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public class ClaimService(
    ApplicationDbContext dbContext,
    UserRolePermissionService authorizationDataService,
    UserRolePermissionService userRolePermissionService,
    UserManager<ApplicationUser> userManager,
    IOpenIddictApplicationManager applicationManager,
    ICacheService cacheService
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

        var userWorkspaceModel = await GetWorkspaceMetadataAsync(user.WorkspaceId, cancellationToken);
        if (userWorkspaceModel is not null)
        {
            user.Workspace = new Workspace
            {
                Id = userWorkspaceModel.Id,
                Name = userWorkspaceModel.Name,
                IsActive = userWorkspaceModel.IsActive
            };
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

        var assignedWorkspaceModel = await GetWorkspaceMetadataAsync(assignedWorkspaceId, cancellationToken);
        if (assignedWorkspaceModel is null || !assignedWorkspaceModel.IsActive)
        {
            return null;
        }

        var assignedWorkspace = new Workspace
        {
            Id = assignedWorkspaceModel.Id,
            Name = assignedWorkspaceModel.Name,
            IsActive = assignedWorkspaceModel.IsActive
        };

        var roles = await authorizationDataService.GetActiveNormalizedRoleNamesForUserAsync(user.Id, assignedWorkspace.Id, cancellationToken);
        var permissions = await authorizationDataService.GetGrantedPermissionCodesAsync(user.Id, assignedWorkspace.Id, cancellationToken);

        return ClaimPrincipalHelpers.Create(user, roles, permissions, requestedScopes, originalUserId, assignedWorkspace);
    }

    private async Task<WorkspaceCacheModel?> GetWorkspaceMetadataAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.Workspace(workspaceId);

        return await cacheService.GetOrCreateAsync<WorkspaceCacheModel?>(
            cacheKey,
            async ct =>
            {
                var workspace = await dbContext.Workspaces
                    .AsNoTracking()
                    .Where(w => w.Id == workspaceId)
                    .Select(w => new WorkspaceCacheModel(w.Id, w.Name, w.IsActive))
                    .FirstOrDefaultAsync(ct);

                return workspace;
            },
            tags: [CacheKeys.Tags.Workspace(workspaceId)],
            cancellationToken: cancellationToken);
    }

    public async Task<ClaimsPrincipal?> BuildClientClaimPrincipalAsync(
        object application,
        IEnumerable<string> grantedScopes,
        CancellationToken cancellationToken = default
    )
    {
        var clientId = await applicationManager.GetClientIdAsync(application, cancellationToken);
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return null;
        }

        var permissions = await applicationManager.GetPermissionsAsync(application, cancellationToken);

        return ClaimPrincipalHelpers.CreateForClient(clientId, permissions, grantedScopes);
    }
}
