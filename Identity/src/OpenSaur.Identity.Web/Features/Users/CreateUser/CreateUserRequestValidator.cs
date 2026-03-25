using System.Text.Json;
using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Users.CreateUser;

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
            .WithMessage("Email must be a valid email address.");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Password is required.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.UserSettings)
            .Must(BeValidJson)
            .WithMessage("User settings must be valid JSON.");
    }

    private static bool BeValidJson(string? userSettings)
    {
        if (string.IsNullOrWhiteSpace(userSettings))
        {
            return true;
        }

        try
        {
            using var _ = JsonDocument.Parse(userSettings);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
