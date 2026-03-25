using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Auth.ChangePassword;

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(request => request.CurrentPassword)
            .NotEmpty()
            .WithMessage("Current password is required.");

        RuleFor(request => request.NewPassword)
            .NotEmpty()
            .WithMessage("New password is required.");
    }
}
