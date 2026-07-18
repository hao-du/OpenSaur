using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class BankAccount : EntityBase
{
    public Guid BankId { get; set; }

    public Bank Bank { get; set; } = null!;

    public string? AccountNumber { get; set; }

    public Guid CurrencyId { get; set; }

    public Currency Currency { get; set; } = null!;

    public decimal Amount { get; set; }

    public decimal? InterestRate { get; set; }
    public string Tags { get; set; } = "[]";

    public DateOnly StartDate { get; set; }

    public DateOnly? MaturityDate { get; set; }

    public BankAccountStatus Status { get; set; } = BankAccountStatus.Active;

    public ICollection<BankAccountTransaction> BankAccountTransactions { get; set; } = [];

    public ICollection<TransactionItem> TransactionItems { get; set; } = [];
}
