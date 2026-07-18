using FluentValidation;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Validations;

internal abstract class CashFlowRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
    where TRequest : ICashFlowFormRequest
{
    protected CashFlowRequestValidatorBase()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)TransactionDirection.In, (byte)TransactionDirection.Out);
    }
}

internal sealed class CreateCashFlowRequestValidator : CashFlowRequestValidatorBase<CreateCashFlowRequest>
{
}

internal sealed class UpdateCashFlowRequestValidator : CashFlowRequestValidatorBase<UpdateCashFlowRequest>
{
    public UpdateCashFlowRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

internal sealed class SaveBankAccountDetailRequestValidator : AbstractValidator<SaveBankAccountDetailRequest>
{
    public SaveBankAccountDetailRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)TransactionDirection.In, (byte)TransactionDirection.Out);
        RuleFor(x => x.TransactionType).InclusiveBetween(
            (byte)BankAccountMovementType.InitialDeposit,
            (byte)BankAccountMovementType.PrincipalReturn);
    }
}

internal abstract class BankAccountFormRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
    where TRequest : IBankAccountFormRequest
{
    protected BankAccountFormRequestValidatorBase()
    {
        ApplyCommonRules();
    }

    private void ApplyCommonRules()
    {
        RuleFor(x => x.BankId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.InterestRate)
            .InclusiveBetween(0, 100)
            .When(x => x.InterestRate.HasValue);
        RuleFor(x => x.MaturityDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.MaturityDate.HasValue);
        RuleFor(x => x.MaturityDate)
            .NotNull()
            .When(x => x.Status == (byte)BankAccountStatus.Matured)
            .WithMessage(TransactionValidationMessages.MaturityDateRequiredWhenMatured);
        RuleFor(x => x.Status).InclusiveBetween(
            (byte)BankAccountStatus.Active,
            (byte)BankAccountStatus.ClosedEarly);
        RuleForEach(x => x.Details).SetValidator(new SaveBankAccountDetailRequestValidator());
    }
}

internal sealed class CreateBankAccountFormRequestValidator : BankAccountFormRequestValidatorBase<CreateBankAccountFormRequest>
{
}

internal sealed class UpdateBankAccountFormRequestValidator : BankAccountFormRequestValidatorBase<UpdateBankAccountFormRequest>
{
    public UpdateBankAccountFormRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

internal sealed class SaveTransferDetailRequestValidator : AbstractValidator<SaveTransferDetailRequest>
{
    public SaveTransferDetailRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Direction).InclusiveBetween((byte)TransactionDirection.In, (byte)TransactionDirection.Out);
    }
}

internal abstract class TransferFormRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
    where TRequest : ITransferFormRequest
{
    protected TransferFormRequestValidatorBase()
    {
        ApplyCommonRules();
    }

    private void ApplyCommonRules()
    {
        RuleFor(x => x.CounterpartyId).NotEmpty();
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.TransferType).InclusiveBetween((byte)TransferType.Lend, (byte)TransferType.Receive);
        RuleFor(x => x.Status).InclusiveBetween((byte)TransferStatus.Active, (byte)TransferStatus.Cancelled);
        RuleForEach(x => x.Details).SetValidator(new SaveTransferDetailRequestValidator());
        RuleFor(x => x.Amount)
            .Equal(x => TransferAmountCalculator.CalculateAmount(x.Details))
            .WithMessage(TransactionValidationMessages.TransferAmountMustEqualDetailSum);
    }
}

internal sealed class CreateTransferFormRequestValidator : TransferFormRequestValidatorBase<CreateTransferFormRequest>
{
}

internal sealed class UpdateTransferFormRequestValidator : TransferFormRequestValidatorBase<UpdateTransferFormRequest>
{
    public UpdateTransferFormRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

internal sealed class ExchangeLegRequestValidator : AbstractValidator<ExchangeLegRequest>
{
    public ExchangeLegRequestValidator()
    {
        RuleFor(x => x.CurrencyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}

internal sealed class CreateCurrencyExchangeRequestValidator : AbstractValidator<CreateCurrencyExchangeRequest>
{
    public CreateCurrencyExchangeRequestValidator()
    {
        RuleFor(x => x.ExchangeRate)
            .GreaterThan(0)
            .When(x => x.ExchangeRate.HasValue);
        RuleFor(x => x.OutLeg).SetValidator(new ExchangeLegRequestValidator());
        RuleFor(x => x.InLeg).SetValidator(new ExchangeLegRequestValidator());
    }
}

internal sealed class UpdateCurrencyExchangeRequestValidator : AbstractValidator<UpdateCurrencyExchangeRequest>
{
    public UpdateCurrencyExchangeRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.ExchangeRate)
            .GreaterThan(0)
            .When(x => x.ExchangeRate.HasValue);
        RuleFor(x => x.OutLeg).SetValidator(new ExchangeLegRequestValidator());
        RuleFor(x => x.InLeg).SetValidator(new ExchangeLegRequestValidator());
    }
}

