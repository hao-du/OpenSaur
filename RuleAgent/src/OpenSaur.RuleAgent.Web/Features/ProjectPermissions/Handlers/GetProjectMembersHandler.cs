using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Handlers;

public static class GetProjectMembersHandler
{
    public static async Task<IResult> HandleAsync(
        Guid projectId,
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

        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
                .ThenInclude(perm => perm.User)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return Results.NotFound(new { message = "Project not found." });
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var hasAccess = isCreator || project.Permissions.Any(p => p.UserId == currentUser.Id && p.IsActive);

        if (!hasAccess)
        {
            return Results.Forbid();
        }

        var members = new List<ProjectMemberResponse>();

        if (project.Creator != null)
        {
            members.Add(new ProjectMemberResponse(
                Id: Guid.Empty,
                ProjectId: project.Id,
                UserId: project.Creator.Id,
                Email: project.Creator.Email,
                UserName: project.Creator.UserName,
                FirstName: project.Creator.FirstName,
                LastName: project.Creator.LastName,
                Permission: ProjectPermissionType.CanEdit,
                IsCreator: true,
                IsActive: true,
                CreatedOn: project.CreatedOn,
                UpdatedOn: project.UpdatedOn));
        }

        foreach (var perm in project.Permissions.Where(p => p.IsActive && p.UserId != project.CreatorId && p.User != null))
        {
            members.Add(new ProjectMemberResponse(
                Id: perm.Id,
                ProjectId: perm.ProjectId,
                UserId: perm.UserId,
                Email: perm.User!.Email,
                UserName: perm.User.UserName,
                FirstName: perm.User.FirstName,
                LastName: perm.User.LastName,
                Permission: perm.Permission,
                IsCreator: false,
                IsActive: perm.IsActive,
                CreatedOn: perm.CreatedOn,
                UpdatedOn: perm.UpdatedOn));
        }

        return Results.Ok(members);
    }
}
