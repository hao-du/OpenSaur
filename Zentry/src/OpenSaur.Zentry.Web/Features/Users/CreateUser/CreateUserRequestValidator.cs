using FluentValidation;

namespace OpenSaur.Zentry.Web.Features.Users.CreateUser;

public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(request => request.UserName)
            .NotEmpty()
            .WithMessage("User name is required.")
            .MaximumLength(256)
            .WithMessage("User name must be 256 characters or fewer.");

        RuleFor(request => request.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("Email must be valid.")
            .MaximumLength(256)
            .WithMessage("Email must be 256 characters or fewer.");

        RuleFor(request => request.FirstName)
            .MaximumLength(256)
            .WithMessage("First name must be 256 characters or fewer.");

        RuleFor(request => request.LastName)
            .MaximumLength(256)
            .WithMessage("Last name must be 256 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Password is required.")
            .MinimumLength(8)
            .WithMessage("Password must be at least 8 characters.");
    }
}
