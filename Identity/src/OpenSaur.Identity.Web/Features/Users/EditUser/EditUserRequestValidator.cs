using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Users.EditUser;

public sealed class EditUserRequestValidator : AbstractValidator<EditUserRequest>
{
    public EditUserRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("User id is required.");

        RuleFor(request => request.UserName)
            .NotEmpty()
            .WithMessage("User name is required.")
            .MaximumLength(256)
            .WithMessage("User name must be 256 characters or fewer.");

        RuleFor(request => request.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("Email must be a valid email address.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.FirstName)
            .MaximumLength(100)
            .WithMessage("First name must be 100 characters or fewer.");

        RuleFor(request => request.LastName)
            .MaximumLength(100)
            .WithMessage("Last name must be 100 characters or fewer.");

        RuleFor(request => request.UserSettings)
            .Must(UserSettingsJson.IsValid)
            .WithMessage("User settings must be valid JSON.");
    }
}
