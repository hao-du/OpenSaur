using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Users.ChangeUserPassword;

public sealed class ChangeUserPasswordRequestValidator : AbstractValidator<ChangeUserPasswordRequest>
{
    public ChangeUserPasswordRequestValidator()
    {
        RuleFor(request => request.UserId)
            .NotEmpty()
            .WithMessage("User id is required.");

        RuleFor(request => request.NewPassword)
            .NotEmpty()
            .WithMessage("New password is required.");
    }
}
