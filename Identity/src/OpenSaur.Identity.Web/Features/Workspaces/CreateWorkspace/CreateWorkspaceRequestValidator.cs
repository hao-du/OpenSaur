using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;

public sealed class CreateWorkspaceRequestValidator : AbstractValidator<CreateWorkspaceRequest>
{
    public CreateWorkspaceRequestValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Workspace name is required.")
            .MaximumLength(200)
            .WithMessage("Workspace name must be 200 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.MaxActiveUsers)
            .GreaterThanOrEqualTo(0)
            .When(request => request.MaxActiveUsers.HasValue)
            .WithMessage("Maximum active users must be zero or greater.");
    }
}
