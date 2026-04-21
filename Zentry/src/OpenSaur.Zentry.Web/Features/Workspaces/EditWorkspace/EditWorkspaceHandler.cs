using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Workspaces.EditWorkspace;

public static class EditWorkspaceHandler
{
    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>>> HandleAsync(
        EditWorkspaceRequest request,
        IValidator<EditWorkspaceRequest> validator,
        ApplicationDbContext dbContext,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var workspace = await dbContext.Workspaces
            .Include(candidate => candidate.WorkspaceRoles)
            .SingleOrDefaultAsync(candidate => candidate.Id == request.Id, cancellationToken);
        if (workspace is null)
        {
            return AppHttpResults.NotFound("Workspace not found.", "No workspace matched the provided identifier.");
        }

        var name = request.Name.Trim();
        var duplicateNameExists = await dbContext.Workspaces
            .AsNoTracking()
            .AnyAsync(candidate => candidate.Id != request.Id && candidate.Name == name, cancellationToken);
        if (duplicateNameExists)
        {
            return AppHttpResults.Conflict("Workspace name already exists.", "A workspace with this name already exists.");
        }

        var currentUserId = WorkspaceHelper.GetCurrentUserId(httpContext.User);

        workspace.Name = name;
        workspace.Description = request.Description;
        workspace.IsActive = request.IsActive;
        workspace.MaxActiveUsers = request.MaxActiveUsers;
        workspace.UpdatedBy = currentUserId;

        await WorkspaceHelper.ApplyWorkspaceRoleAssignmentsAsync(
            dbContext,
            workspace,
            request.AssignedRoleIds,
            currentUserId,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
