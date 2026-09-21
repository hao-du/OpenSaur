using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Workspaces;
using OpenSaur.Zentry.Web.Features.Roles;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using OpenSaur.Zentry.Web.Infrastructure.Lock;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Workspaces.CreateWorkspace;

public static class CreateWorkspaceHandler
{
    private static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(10);

    public static async Task<Results<Ok<CreateWorkspaceResponse>, ValidationProblem, Conflict<ProblemDetails>>> HandleAsync(
        CreateWorkspaceRequest request,
        IValidator<CreateWorkspaceRequest> validator,
        ApplicationDbContext dbContext,
        RoleService roleService,
        WorkspaceService workspaceService,
        ILockService lockService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var name = request.Name.Trim();
        var lockKey = LockKeys.WorkspaceCreate(name.ToUpperInvariant());
        var lockAcquired = await lockService.TryAcquireLockAsync(lockKey, LockTimeout, cancellationToken);
        if (!lockAcquired)
        {
            return AppHttpResults.Conflict("Workspace creation in progress.", "Another workspace creation operation with this name is currently in progress. Please try again.");
        }

        try
        {
            var duplicateNameExists = await dbContext.Workspaces
                .AsNoTracking()
                .AnyAsync(candidate => candidate.Name == name, cancellationToken);
            if (duplicateNameExists)
            {
                return AppHttpResults.Conflict("Workspace name already exists.", "A workspace with this name already exists.");
            }

            var currentUserId = ClaimHelper.GetCurrentUserId(httpContext.User);
            var selectedActiveRoleIds = await roleService.GetSelectedActiveRoleIdsAsync(request.AssignedRoleIds, cancellationToken);
            var workspace = new Workspace
            {
                Name = name,
                Description = request.Description,
                IsActive = true,
                MaxActiveUsers = request.MaxActiveUsers,
                CreatedBy = currentUserId
            };

            await workspaceService.ApplyWorkspaceRoleAssignmentsAsync(
                workspace,
                selectedActiveRoleIds,
                currentUserId,
                cancellationToken);

            dbContext.Workspaces.Add(workspace);
            await dbContext.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(new CreateWorkspaceResponse(workspace.Id));
        }
        finally
        {
            await lockService.ReleaseLockAsync(lockKey, cancellationToken);
        }
    }
}
