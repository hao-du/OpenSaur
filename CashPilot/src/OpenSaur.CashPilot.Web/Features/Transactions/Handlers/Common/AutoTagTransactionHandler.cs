using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class AutoTagTransactionHandler
{
    public static async Task<Results<Ok<AutoTagResponse>, ProblemHttpResult>> HandleAsync(
        AutoTagRequest request,
        ClaimsPrincipal user,
        TransactionAutoTagService autoTagService,
        CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = ClaimHelper.GetCurrentUserId(user);
            var response = await autoTagService.SuggestTagsAsync(currentUserId, request, cancellationToken);
            return TypedResults.Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException)
        {
            return TypedResults.Problem(
                "Auto Tag provider is unavailable.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (System.Text.Json.JsonException)
        {
            return TypedResults.Problem(
                "Auto Tag provider returned an invalid response.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
