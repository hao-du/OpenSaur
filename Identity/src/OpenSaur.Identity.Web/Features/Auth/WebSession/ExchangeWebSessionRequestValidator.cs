using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Auth.WebSession;

public sealed class ExchangeWebSessionRequestValidator : AbstractValidator<ExchangeWebSessionRequest>
{
    public ExchangeWebSessionRequestValidator()
    {
        RuleFor(request => request.Code)
            .NotEmpty()
            .WithMessage("Authorization code is required.");
    }
}
