namespace OpenSaur.CashPilot.Web.Domain;

public enum TransactionDirection : byte
{
    In = 1,
    Out = 2
}

public enum BankAccountStatus : byte
{
    Active = 1,
    Matured = 2,
    ClosedEarly = 3
}

public enum BankAccountMovementType : byte
{
    InitialDeposit = 1,
    InterestPayment = 2,
    PrincipalReturn = 3
}

public enum TransferType : byte
{
    Lend = 1,
    Borrow = 2,
    Give = 3,
    Receive = 4
}

public enum TransferStatus : byte
{
    Active = 1,
    Completed = 2,
    Cancelled = 3
}
