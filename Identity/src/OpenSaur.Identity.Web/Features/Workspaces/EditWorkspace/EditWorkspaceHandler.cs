using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Validation;

namespace OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;

public static class EditWorkspaceHandler
{
    public static async Task<IResult> HandleAsync(
        EditWorkspaceRequest request,
        IValidator<EditWorkspaceRequest> validator,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (await validator.ValidateRequestAsync(request, cancellationToken) is { } validationFailure)
        {
            return validationFailure;
        }

        var workspace = await dbContext.Workspaces.SingleOrDefaultAsync(candidate => candidate.Id == request.Id, cancellationToken);
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

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success().ToApiResult();
    }
}
