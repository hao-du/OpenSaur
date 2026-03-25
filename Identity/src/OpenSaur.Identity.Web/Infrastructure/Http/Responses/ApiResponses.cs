using Microsoft.AspNetCore.Http;
using OpenSaur.Identity.Web.Infrastructure.Results;
using HttpResults = Microsoft.AspNetCore.Http.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public static class ApiResponses
{
    public static IResult Success<T>(T? data)
    {
        return HttpResults.Json(
            new ApiEnvelope<T>(true, data, []),
            statusCode: StatusCodes.Status200OK);
    }

    public static IResult NoContent()
    {
        return Success<object?>(null);
    }

    private static IResult Error(int statusCode, IReadOnlyList<ResultError> errors)
    {
        return HttpResults.Json(
            new ApiEnvelope<object?>(
                false,
                null,
                errors.Select(static error => new ApiError(error.Code, error.Message, error.Detail)).ToArray()),
            statusCode: statusCode);
    }

    public static IResult Error(Result result)
    {
        return Error(result.StatusCode, result.Errors);
    }

    public static IResult ToApiResult(this Result result)
    {
        return result.IsSuccess
            ? NoContent()
            : result.ToApiErrorResult();
    }

    public static IResult ToApiResult<T>(this Result<T> result)
    {
        if (!result.IsSuccess)
        {
            return result.ToApiErrorResult();
        }

        return Success(result.Value);
    }

    public static IResult ToApiResult<TSource, TResponse>(
        this Result<TSource> result,
        Func<TSource, TResponse> mapper)
    {
        if (!result.IsSuccess)
        {
            return result.ToApiErrorResult();
        }

        return Success(mapper(result.Value!));
    }

    public static IResult ToApiErrorResult(this Result result)
    {
        return Error(result);
    }
}
