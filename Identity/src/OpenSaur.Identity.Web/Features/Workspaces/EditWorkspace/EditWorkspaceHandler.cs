using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;

public static class EditWorkspaceHandler
{
    public static async Task<IResult> HandleAsync(
        EditWorkspaceRequest request,
        IValidator<EditWorkspaceRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var workspace = await dbContext.Workspaces
            .Include(candidate => candidate.WorkspaceRoles)
            .SingleOrDefaultAsync(candidate => candidate.Id == request.Id, cancellationToken);
        if (workspace is null)
        {
            return Result.NotFound(
                    "Workspace not found.",
                    "No workspace matched the provided identifier.")
                .ToApiErrorResult();
        }

        var name = request.Name.Trim();
        var duplicateNameExists = await dbContext.Workspaces
            .AsNoTracking()
            .AnyAsync(
                candidate => candidate.Id != request.Id && candidate.Name == name,
                cancellationToken);
        if (duplicateNameExists)
        {
            return Result.Validation(WorkspaceValidationProblems.ForDuplicateName()).ToApiErrorResult();
        }

        workspace.Name = name;
        workspace.Description = request.Description;
        workspace.IsActive = request.IsActive;

        var selectedRoleIds = request.AssignedRoleIds?.Distinct().ToArray() ?? [];
        var selectedActiveRoles = await dbContext.Roles
            .AsNoTracking()
            .Where(role => role.IsActive && selectedRoleIds.Contains(role.Id))
            .Select(role => new
            {
                role.Id,
                NormalizedName = role.NormalizedName ?? string.Empty
            })
            .ToListAsync(cancellationToken);
        var selectedActiveRoleIds = selectedActiveRoles
            .Where(role => !SystemRoles.IsSuperAdministratorValue(role.NormalizedName))
            .Select(role => role.Id)
            .ToList();

        var activeWorkspaceRoles = workspace.WorkspaceRoles
            .Where(workspaceRole => workspaceRole.IsActive)
            .ToList();
        var roleIdsToDeactivate = activeWorkspaceRoles
            .Where(workspaceRole => !selectedActiveRoleIds.Contains(workspaceRole.RoleId))
            .Select(workspaceRole => workspaceRole.RoleId)
            .ToHashSet();

        foreach (var workspaceRole in activeWorkspaceRoles.Where(workspaceRole => roleIdsToDeactivate.Contains(workspaceRole.RoleId)))
        {
            workspaceRole.IsActive = false;
        }

        foreach (var roleId in selectedActiveRoleIds.Except(activeWorkspaceRoles.Select(workspaceRole => workspaceRole.RoleId)))
        {
            var existingWorkspaceRole = workspace.WorkspaceRoles.SingleOrDefault(workspaceRole => workspaceRole.RoleId == roleId);
            if (existingWorkspaceRole is not null)
            {
                existingWorkspaceRole.IsActive = true;
                continue;
            }

            workspace.WorkspaceRoles.Add(
                new Domain.Workspaces.WorkspaceRole
                {
                    WorkspaceId = workspace.Id,
                    RoleId = roleId,
                    Description = $"Role availability for {workspace.Name}.",
                    CreatedBy = currentUserContext.UserId
                });
        }

        if (roleIdsToDeactivate.Count > 0)
        {
            var assignmentsToDeactivate = await dbContext.UserRoles
                .Include(userRole => userRole.User)
                .Where(userRole => userRole.IsActive && roleIdsToDeactivate.Contains(userRole.RoleId))
                .Where(userRole => userRole.User != null && userRole.User.WorkspaceId == workspace.Id)
                .ToListAsync(cancellationToken);

            foreach (var assignment in assignmentsToDeactivate)
            {
                assignment.IsActive = false;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success().ToApiResult();
    }
}
