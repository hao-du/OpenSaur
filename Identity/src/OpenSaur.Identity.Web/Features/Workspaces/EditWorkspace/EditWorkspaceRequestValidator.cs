using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;

public sealed class EditWorkspaceRequestValidator : AbstractValidator<EditWorkspaceRequest>
{
    public EditWorkspaceRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("Workspace id is required.");

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Workspace name is required.")
            .MaximumLength(200)
            .WithMessage("Workspace name must be 200 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");
    }
}
