using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using System.Text.RegularExpressions;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Validations;

public sealed class CreateCounterpartyRequestValidator : AbstractValidator<CreateCounterpartyRequest>
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneNumberRegex = new(@"^[0-9+\-() ]+$", RegexOptions.Compiled);

    public CreateCounterpartyRequestValidator()
    {
        ApplyCommonRules();
    }

    private void ApplyCommonRules()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .MaximumLength(254)
            .Must(value => string.IsNullOrWhiteSpace(value) || EmailRegex.IsMatch(value.Trim()))
            .WithMessage("Invalid email format.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(25)
            .Must(value => string.IsNullOrWhiteSpace(value) || PhoneNumberRegex.IsMatch(value.Trim()))
            .WithMessage("Phone number format is invalid.");

        RuleFor(x => x.Description)
            .MaximumLength(255);
    }
}

public sealed class UpdateCounterpartyRequestValidator : AbstractValidator<UpdateCounterpartyRequest>
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneNumberRegex = new(@"^[0-9+\-() ]+$", RegexOptions.Compiled);

    public UpdateCounterpartyRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .MaximumLength(254)
            .Must(value => string.IsNullOrWhiteSpace(value) || EmailRegex.IsMatch(value.Trim()))
            .WithMessage("Invalid email format.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(25)
            .Must(value => string.IsNullOrWhiteSpace(value) || PhoneNumberRegex.IsMatch(value.Trim()))
            .WithMessage("Phone number format is invalid.");

        RuleFor(x => x.Description)
            .MaximumLength(255);
    }
}
