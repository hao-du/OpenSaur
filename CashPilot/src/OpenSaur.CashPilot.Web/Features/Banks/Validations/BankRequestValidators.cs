using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Banks.Validations;

public sealed class CreateBankRequestValidator : AbstractValidator<CreateBankRequest>
{
    public CreateBankRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.ShortName)
            .NotEmpty()
            .MaximumLength(20);
    }
}

public sealed class UpdateBankRequestValidator : AbstractValidator<UpdateBankRequest>
{
    public UpdateBankRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.ShortName)
            .NotEmpty()
            .MaximumLength(20);
    }
}
