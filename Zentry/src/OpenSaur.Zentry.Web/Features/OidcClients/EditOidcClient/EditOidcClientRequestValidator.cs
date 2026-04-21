using FluentValidation;

namespace OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;

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

        RuleFor(request => request.RedirectUris)
            .NotNull()
            .WithMessage("At least one redirect URI is required.")
            .Must(redirectUris => redirectUris.Length > 0)
            .WithMessage("At least one redirect URI is required.");

        RuleForEach(request => request.RedirectUris)
            .NotEmpty()
            .WithMessage("Redirect URI is required.")
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Redirect URI must be an absolute URI.");

        RuleFor(request => request.PostLogoutRedirectUris)
            .NotNull()
            .WithMessage("Post-logout redirect URIs are required.");

        RuleForEach(request => request.PostLogoutRedirectUris)
            .NotEmpty()
            .WithMessage("Post-logout redirect URI is required.")
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Post-logout redirect URI must be an absolute URI.");

        RuleFor(request => request.Scope)
            .NotEmpty()
            .WithMessage("Scope is required.")
            .MaximumLength(512)
            .WithMessage("Scope must be 512 characters or fewer.");
    }
}
