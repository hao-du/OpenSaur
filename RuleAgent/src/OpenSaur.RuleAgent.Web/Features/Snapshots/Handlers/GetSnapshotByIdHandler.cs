using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Handlers;

public static class GetSnapshotByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid snapshotId,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!userContext.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        var currentUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var snapshot = await dbContext.NodeSnapshots
            .AsNoTracking()
            .Include(s => s.Node)
            .FirstOrDefaultAsync(s => s.Id == snapshotId && s.IsActive, cancellationToken);

        if (snapshot is null || snapshot.Node is null || !snapshot.Node.IsActive || snapshot.Node.WorkspaceId != currentUser.WorkspaceId)
        {
            return Results.NotFound(new { message = "Snapshot not found." });
        }

        if (snapshot.Node.ProjectId.HasValue)
        {
            var project = await dbContext.Projects
                .AsNoTracking()
                .Include(p => p.Permissions)
                .FirstOrDefaultAsync(p => p.Id == snapshot.Node.ProjectId.Value && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

            if (project is null)
            {
                return Results.NotFound(new { message = "Project not found." });
            }

            var isCreator = project.CreatorId == currentUser.Id;
            var hasPermission = project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive);
            if (!isCreator && !hasPermission)
            {
                return Results.Forbid();
            }
        }

        var response = new SnapshotResponse(
            snapshot.Id,
            snapshot.NodeId,
            snapshot.SnapshotContent,
            snapshot.Status,
            snapshot.Description,
            snapshot.IsActive,
            snapshot.CreatedBy,
            snapshot.CreatedOn,
            snapshot.UpdatedBy,
            snapshot.UpdatedOn);

        return Results.Ok(response);
    }
}
