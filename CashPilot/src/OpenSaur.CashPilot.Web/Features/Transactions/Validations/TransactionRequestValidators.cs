using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Validations;

public sealed class CreateCashFlowRequestValidator : AbstractValidator<CreateCashFlowRequest>
{
    public CreateCashFlowRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)1, (byte)2);
    }
}

public sealed class UpdateCashFlowRequestValidator : AbstractValidator<UpdateCashFlowRequest>
{
    public UpdateCashFlowRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)1, (byte)2);
    }
}

public sealed class SaveBankAccountDetailRequestValidator : AbstractValidator<SaveBankAccountDetailRequest>
{
    public SaveBankAccountDetailRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)1, (byte)2);
        RuleFor(x => x.TransactionType).InclusiveBetween((byte)1, (byte)3);
    }
}

public sealed class CreateBankAccountFormRequestValidator : AbstractValidator<SaveBankAccountFormRequest>
{
    public CreateBankAccountFormRequestValidator()
    {
        RuleFor(x => x.Id).Null();
        ApplyCommonRules();
    }

    private void ApplyCommonRules()
    {
        RuleFor(x => x.BankId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.InterestRate).InclusiveBetween(0, 100);
        RuleFor(x => x.MaturityDate).GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.Status).InclusiveBetween((byte)1, (byte)3);
        RuleForEach(x => x.Details).SetValidator(new SaveBankAccountDetailRequestValidator());
    }
}

public sealed class UpdateBankAccountFormRequestValidator : AbstractValidator<SaveBankAccountFormRequest>
{
    public UpdateBankAccountFormRequestValidator()
    {
        RuleFor(x => x.Id).NotNull();
        RuleFor(x => x.Id!.Value).NotEmpty();

        RuleFor(x => x.BankId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.InterestRate).InclusiveBetween(0, 100);
        RuleFor(x => x.MaturityDate).GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.Status).InclusiveBetween((byte)1, (byte)3);
        RuleForEach(x => x.Details).SetValidator(new SaveBankAccountDetailRequestValidator());
    }
}

public sealed class SaveTransferDetailRequestValidator : AbstractValidator<SaveTransferDetailRequest>
{
    public SaveTransferDetailRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)1, (byte)2);
    }
}

public sealed class CreateTransferFormRequestValidator : AbstractValidator<SaveTransferFormRequest>
{
    public CreateTransferFormRequestValidator()
    {
        RuleFor(x => x.Id).Null();
        ApplyCommonRules();
    }

    private void ApplyCommonRules()
    {
        RuleFor(x => x.CounterpartyId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TransferType).InclusiveBetween((byte)1, (byte)4);
        RuleFor(x => x.Status).InclusiveBetween((byte)1, (byte)3);
        RuleForEach(x => x.Details).SetValidator(new SaveTransferDetailRequestValidator());
        RuleFor(x => x.Amount)
            .Equal(x => x.Details.Sum(y => y.Amount))
            .WithMessage("Transfer amount must equal sum of detail amounts.");
    }
}

public sealed class UpdateTransferFormRequestValidator : AbstractValidator<SaveTransferFormRequest>
{
    public UpdateTransferFormRequestValidator()
    {
        RuleFor(x => x.Id).NotNull();
        RuleFor(x => x.Id!.Value).NotEmpty();
        RuleFor(x => x.CounterpartyId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TransferType).InclusiveBetween((byte)1, (byte)4);
        RuleFor(x => x.Status).InclusiveBetween((byte)1, (byte)3);
        RuleForEach(x => x.Details).SetValidator(new SaveTransferDetailRequestValidator());
        RuleFor(x => x.Amount)
            .Equal(x => x.Details.Sum(y => y.Amount))
            .WithMessage("Transfer amount must equal sum of detail amounts.");
    }
}

public sealed class ExchangeLegRequestValidator : AbstractValidator<ExchangeLegRequest>
{
    public ExchangeLegRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}

public sealed class CreateCurrencyExchangeRequestValidator : AbstractValidator<CreateCurrencyExchangeRequest>
{
    public CreateCurrencyExchangeRequestValidator()
    {
        RuleFor(x => x.ExchangeRate).GreaterThan(0);
        RuleFor(x => x.OutLeg).SetValidator(new ExchangeLegRequestValidator());
        RuleFor(x => x.InLeg).SetValidator(new ExchangeLegRequestValidator());
    }
}

public sealed class UpdateCurrencyExchangeRequestValidator : AbstractValidator<UpdateCurrencyExchangeRequest>
{
    public UpdateCurrencyExchangeRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.ExchangeRate).GreaterThan(0);
        RuleFor(x => x.OutLeg).SetValidator(new ExchangeLegRequestValidator());
        RuleFor(x => x.InLeg).SetValidator(new ExchangeLegRequestValidator());
    }
}
