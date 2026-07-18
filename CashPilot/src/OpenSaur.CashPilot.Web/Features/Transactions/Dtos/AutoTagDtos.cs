namespace OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

public sealed record AutoTagRequest(
    string? Description,
    string? TransactionType,
    string[] ExistingTags);

public sealed record AutoTagResponse(string[] Tags);
