using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Dashboard.GetDashboardSummary;

public static class GetDashboardSummaryHandler
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public static async Task<Ok<DashboardSummaryResponse>> HandleAsync(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var isSuperAdmin = ClaimHelper.IsSuperAdministrator(user);
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        var scopeKey = isSuperAdmin ? "global" : $"ws:{workspaceId}";
        var cacheKey = CacheKeys.DashboardSummary(scopeKey);

        var cached = await cacheService.GetAsync<DashboardSummaryResponse>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return TypedResults.Ok(cached);
        }

        DashboardSummaryResponse response;

        if (isSuperAdmin)
        {
            var workspaceCount = await dbContext.Workspaces.CountAsync(cancellationToken);
            var activeWorkspaceCount = await dbContext.Workspaces.CountAsync(workspace => workspace.IsActive, cancellationToken);
            var globalActiveUserCount = await dbContext.Users.CountAsync(candidate => candidate.IsActive, cancellationToken);
            var globalInactiveUserCount = await dbContext.Users.CountAsync(candidate => !candidate.IsActive, cancellationToken);
            var globalAvailableRoleCount = await dbContext.Roles.CountAsync(role =>
                role.IsActive
                && role.NormalizedName != Constants.NormalizedSuperAdministrator,
                cancellationToken);

            response = new DashboardSummaryResponse(
                "global",
                null,
                workspaceCount,
                activeWorkspaceCount,
                globalActiveUserCount,
                globalInactiveUserCount,
                globalAvailableRoleCount,
                null);
        }
        else
        {
            var workspaceSummary = workspaceId.HasValue
                ? await dbContext.Workspaces
                    .AsNoTracking()
                    .Where(workspace => workspace.Id == workspaceId.Value)
                    .Select(workspace => new
                    {
                        workspace.Name,
                        workspace.MaxActiveUsers
                    })
                    .SingleOrDefaultAsync(cancellationToken)
                : null;

            var activeUserCount = workspaceId.HasValue
                ? await dbContext.Users
                    .AsNoTracking()
                    .Where(candidate => candidate.WorkspaceId == workspaceId.Value && candidate.IsActive)
                    .CountAsync(cancellationToken)
                : 0;
            var inactiveUserCount = workspaceId.HasValue
                ? await dbContext.Users
                    .AsNoTracking()
                    .Where(candidate => candidate.WorkspaceId == workspaceId.Value && !candidate.IsActive)
                    .CountAsync(cancellationToken)
                : 0;
            var availableRoleCount = workspaceId.HasValue
                ? await dbContext.WorkspaceRoles
                    .AsNoTracking()
                    .Where(workspaceRole => workspaceRole.WorkspaceId == workspaceId.Value && workspaceRole.IsActive)
                    .Join(
                        dbContext.Roles.AsNoTracking().Where(role =>
                            role.IsActive
                            && role.NormalizedName != Constants.NormalizedSuperAdministrator),
                        workspaceRole => workspaceRole.RoleId,
                        role => role.Id,
                        (_, role) => role.Id)
                    .Distinct()
                    .CountAsync(cancellationToken)
                : 0;

            response = new DashboardSummaryResponse(
                "workspace",
                workspaceSummary?.Name ?? "Protected workspace",
                workspaceSummary is null ? 0 : 1,
                workspaceSummary is null ? 0 : 1,
                activeUserCount,
                inactiveUserCount,
                availableRoleCount,
                workspaceSummary?.MaxActiveUsers);
        }

        await cacheService.SetAsync(cacheKey, response, CacheDuration, cancellationToken);

        return TypedResults.Ok(response);
    }
}
