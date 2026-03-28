using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Auth.Impersonation;

public sealed class StartImpersonationRequestValidator : AbstractValidator<StartImpersonationRequest>
{
    public StartImpersonationRequestValidator()
    {
        RuleFor(request => request.WorkspaceId)
            .NotEmpty()
            .WithMessage("Workspace id is required.");
    }
}
