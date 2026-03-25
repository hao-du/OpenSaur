using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public static class ApiResultExtensions
{
    public static IResult ToApiResult(this Result result)
    {
        return result.IsSuccess
            ? ApiResponses.NoContent()
            : result.ToApiErrorResult();
    }

    public static IResult ToApiResult<T>(this Result<T> result)
    {
        if (!result.IsSuccess)
        {
            return result.ToApiErrorResult();
        }

        return ApiResponses.Success(result.Value);
    }

    public static IResult ToApiResult<TSource, TResponse>(
        this Result<TSource> result,
        Func<TSource, TResponse> mapper)
    {
        if (!result.IsSuccess)
        {
            return result.ToApiErrorResult();
        }

        return ApiResponses.Success(mapper(result.Value!));
    }

    public static IResult ToApiErrorResult(this Result result)
    {
        return ApiResponses.Error(result);
    }
}
