using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
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
            CreatedBy = currentUserContext.UserId
        };

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ApiResponses.Success(new CreateWorkspaceResponse(workspace.Id));
    }
}
