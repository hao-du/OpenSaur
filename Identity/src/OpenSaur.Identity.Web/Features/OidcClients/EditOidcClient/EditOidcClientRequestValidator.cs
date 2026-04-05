using FluentValidation;

namespace OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;

public sealed class EditOidcClientRequestValidator : AbstractValidator<EditOidcClientRequest>
{
    public EditOidcClientRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("Client id is required.");

        RuleFor(request => request.ClientId)
            .NotEmpty()
            .WithMessage("Client id is required.")
            .MaximumLength(100)
            .WithMessage("Client id must be 100 characters or fewer.");

        RuleFor(request => request.ClientSecret)
            .MaximumLength(512)
            .WithMessage("Client secret must be 512 characters or fewer.");

        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Display name is required.")
            .MaximumLength(200)
            .WithMessage("Display name must be 200 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.Scope)
            .NotEmpty()
            .WithMessage("Scope is required.")
            .MaximumLength(512)
            .WithMessage("Scope must be 512 characters or fewer.");

        RuleFor(request => request.AppPathBase)
            .NotEmpty()
            .WithMessage("Application path base is required.")
            .MaximumLength(200)
            .WithMessage("Application path base must be 200 characters or fewer.");

        RuleFor(request => request.Origins)
            .NotNull()
            .WithMessage("At least one origin is required.")
            .Must(origins => origins.Length > 0)
            .WithMessage("At least one origin is required.");
    }
}
