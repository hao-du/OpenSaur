using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateCashFlowHandler
{
    private static readonly UpdateCashFlowRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        UpdateCashFlowRequest request,
        ClaimsPrincipal user,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Transactions require an authenticated user identifier.");
        }

        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var hasCurrency = await dbContext.Currencies
            .AnyAsync(x => x.Id == request.CurrencyId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        if (!hasCurrency)
        {
            return AppHttpResults.BadRequest("Currency is invalid.", "The selected currency does not exist for the current user.");
        }

        var entity = await dbContext.CashFlows
            .Include(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .SingleOrDefaultAsync(x => x.Id == request.Id && x.Transaction.OwnerId == currentUserId, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("CashFlow not found.", "No CashFlow matched the specified identifier.");
        }

        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;
        entity.Transaction.Amount = request.Amount;
        entity.Transaction.CurrencyId = request.CurrencyId;
        entity.Transaction.Direction = (TransactionDirection)request.Direction;
        entity.Transaction.TransactionDate = request.TransactionDate;
        entity.Transaction.Description = request.Description?.Trim() ?? string.Empty;
        entity.Tags = TagTermCodec.Encode(request.Tags ?? []);
        await tagService.EnsureTagDefinitionsExistAsync(currentUserId, request.Tags ?? [], cancellationToken);

        dbContext.TransactionItems.RemoveRange(entity.TransactionItems);
        entity.TransactionItems = request.TransactionItems
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .Select(x => new TransactionItem
            {
                Name = x.Name.Trim(),
                Amount = x.Amount
            })
            .ToList();

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(request.Id);
    }
}
