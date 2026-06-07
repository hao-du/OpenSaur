namespace OpenSaur.CashPilot.Web.Infrastructure.Validation;

internal static class TransactionValidationMessages
{
    public const string UserRequiredTitle = "User is required.";
    public const string UserRequiredDetail = "Transactions require an authenticated user identifier.";

    public const string CurrencyInvalidTitle = "Currency is invalid.";
    public const string CurrencyInvalidDetail = "The selected currency does not exist for the current user.";
    public const string CurrenciesInvalidDetail = "One or more selected currencies do not exist for the current user.";

    public const string BankInvalidTitle = "Bank is invalid.";
    public const string BankInvalidDetail = "The selected bank does not exist for the current user.";

    public const string CounterpartyInvalidTitle = "Counterparty is invalid.";
    public const string CounterpartyInvalidDetail = "The selected counterparty does not exist for the current user.";

    public const string BankAccountNotFoundTitle = "BankAccount not found.";
    public const string BankAccountNotFoundDetail = "No BankAccount matched the specified identifier.";
    public const string BankAccountTransactionNotFoundTitle = "BankAccountTransaction not found.";
    public const string BankAccountTransactionNotFoundDetail = "A detail row did not match the specified identifier.";

    public const string CashFlowNotFoundTitle = "CashFlow not found.";
    public const string CashFlowNotFoundDetail = "No CashFlow matched the specified identifier.";

    public const string TransferNotFoundTitle = "Transfer not found.";
    public const string TransferNotFoundDetail = "No Transfer matched the specified identifier.";
    public const string TransferTransactionNotFoundTitle = "TransferTransaction not found.";
    public const string TransferTransactionNotFoundDetail = "A detail row did not match the specified identifier.";

    public const string CurrencyExchangeNotFoundTitle = "CurrencyExchange not found.";
    public const string CurrencyExchangeNotFoundDetail = "No CurrencyExchange matched the specified identifier.";
    public const string InvalidExchangeDataTitle = "Invalid exchange data.";
    public const string InvalidExchangeDataDetail = "Exchange requires one In and one Out leg.";

    public const string MaturityDateRequiredWhenMatured = "MaturityDate is required when status is Matured.";
    public const string TransferAmountMustEqualDetailSum = "Transfer amount must equal sum of detail amounts.";
}

