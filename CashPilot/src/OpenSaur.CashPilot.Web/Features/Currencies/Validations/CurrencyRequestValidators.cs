using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Validations;

public sealed class CreateCurrencyRequestValidator : AbstractValidator<CreateCurrencyRequest>
{
    public CreateCurrencyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.ShortName)
            .NotEmpty()
            .Length(3, 4);
    }
}

public sealed class UpdateCurrencyRequestValidator : AbstractValidator<UpdateCurrencyRequest>
{
    public UpdateCurrencyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.ShortName)
            .NotEmpty()
            .Length(3, 4);
    }
}
