using FluentValidation;

namespace OpenSaur.Zentry.Web.Features.Users.ResetUserPassword;

public sealed class ResetUserPasswordRequestValidator : AbstractValidator<ResetUserPasswordRequest>
{
    public ResetUserPasswordRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("User identifier is required.");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Password is required.")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters.");
    }
}
