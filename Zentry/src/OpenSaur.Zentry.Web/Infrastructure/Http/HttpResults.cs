using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace OpenSaur.Zentry.Web.Infrastructure.Http;

internal static class HttpResults
{
    public static ValidationProblem ValidationProblem(ValidationResult validationResult)
    {
        return TypedResults.ValidationProblem(validationResult.ToDictionary());
    }

    public static Conflict<ProblemDetails> Conflict(string title, string detail)
    {
        return TypedResults.Conflict(CreateProblemDetails(StatusCodes.Status409Conflict, title, detail));
    }

    public static NotFound<ProblemDetails> NotFound(string title, string detail)
    {
        return TypedResults.NotFound(CreateProblemDetails(StatusCodes.Status404NotFound, title, detail));
    }

    public static BadRequest<ProblemDetails> BadRequest(string title, string detail)
    {
        return TypedResults.BadRequest(CreateProblemDetails(StatusCodes.Status400BadRequest, title, detail));
    }

    private static ProblemDetails CreateProblemDetails(int statusCode, string title, string detail)
    {
        return new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = statusCode
        };
    }
}
