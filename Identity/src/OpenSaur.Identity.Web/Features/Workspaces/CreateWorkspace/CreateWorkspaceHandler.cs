using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;

public static class CreateWorkspaceHandler
{
    public static async Task<IResult> HandleAsync(
        CreateWorkspaceRequest request,
        IValidator<CreateWorkspaceRequest> validator,
        CurrentUserContext currentUserContext,
        ApplicationDbContext dbContext,
        OutboxMessageWriter outboxMessageWriter,
        WorkspaceRepository workspaceRepository,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var name = request.Name.Trim();
        var existingWorkspacesResult = await workspaceRepository.GetWorkspacesByNameAsync(
            new GetWorkspacesByNameRequest(name),
            cancellationToken);
        if (existingWorkspacesResult.Value is { Workspaces.Count: > 0 })
        {
            return Result.Validation(WorkspaceValidationProblems.ForDuplicateName()).ToApiErrorResult();
        }

        var workspace = new Workspace
        {
            Name = name,
            Description = request.Description,
            IsActive = true,
            MaxActiveUsers = request.MaxActiveUsers,
            CreatedBy = currentUserContext.UserId
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);

        var selectedRoleIds = request.AssignedRoleIds?.Distinct().ToArray() ?? [];
        var selectedActiveRoleIds = Array.Empty<Guid>();
        if (selectedRoleIds.Length > 0)
        {
            var availableRoles = await dbContext.Roles
                .AsNoTracking()
                .Where(role => role.IsActive && selectedRoleIds.Contains(role.Id))
                .Select(role => new
                {
                    role.Id,
                    NormalizedName = role.NormalizedName ?? string.Empty
                })
                .ToListAsync(cancellationToken);

            selectedActiveRoleIds = availableRoles
                .Where(role => !SystemRoles.IsSuperAdministratorValue(role.NormalizedName))
                .Select(role => role.Id)
                .ToArray();

            foreach (var roleId in selectedActiveRoleIds)
            {
                dbContext.WorkspaceRoles.Add(
                    new WorkspaceRole
                    {
                        WorkspaceId = workspace.Id,
                        RoleId = roleId,
                        Description = $"Role availability for {workspace.Name}.",
                        CreatedBy = currentUserContext.UserId
                    });
            }
        }

        outboxMessageWriter.EnqueueWorkspaceCreated(workspace, selectedActiveRoleIds, currentUserContext.UserId);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return ApiResponses.Success(new CreateWorkspaceResponse(workspace.Id));
    }
}
