using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public static class GetImpersonationOptionsHandler
{
    public static async Task<IResult> HandleAsync(
        Guid workspaceId,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var normalizedSuperAdministrator = SystemRoles.NormalizedSuperAdministrator;
        var spacedNormalizedSuperAdministrator = SystemRoles.SuperAdministrator.ToUpperInvariant();

        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .Where(candidate => candidate.Id == workspaceId && candidate.IsActive)
            .Select(candidate => new
            {
                candidate.Id,
                candidate.Name
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (workspace is null)
        {
            return Result.NotFound(
                    "Workspace not found.",
                    "No active workspace matched the provided identifier.")
                .ToApiErrorResult();
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.IsActive)
            .Where(candidate =>
                candidate.WorkspaceId == workspaceId
                || candidate.UserRoles.Any(
                    assignment => assignment.IsActive
                                  && assignment.Role != null
                                  && assignment.Role.IsActive
                                  && (assignment.Role.NormalizedName == normalizedSuperAdministrator
                                      || assignment.Role.NormalizedName == spacedNormalizedSuperAdministrator)))
            .OrderBy(candidate => candidate.UserName)
            .Select(candidate => new ImpersonationUserResponse(
                candidate.Id,
                candidate.UserName ?? string.Empty,
                candidate.Email ?? string.Empty))
            .ToListAsync(cancellationToken);

        return Result<GetImpersonationOptionsResponse>.Success(
                new GetImpersonationOptionsResponse(workspace.Id, workspace.Name, users))
            .ToApiResult();
    }
}
