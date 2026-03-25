using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;

public sealed class ChangeUserWorkspaceRequestValidator : AbstractValidator<ChangeUserWorkspaceRequest>
{
    public ChangeUserWorkspaceRequestValidator()
    {
        RuleFor(request => request.UserId)
            .NotEmpty()
            .WithMessage("User id is required.");

        RuleFor(request => request.WorkspaceId)
            .NotEmpty()
            .WithMessage("Workspace id is required.");
    }
}
