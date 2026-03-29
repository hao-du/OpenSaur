namespace OpenSaur.Identity.Web.Infrastructure.Results;

public static class ResultErrors
{
    public static ResultError Validation(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.Validation, message, detail);
    }

    public static ResultError Validation(string code, string message, string detail)
    {
        return new ResultError(code, message, detail);
    }

    public static ResultError Unauthorized(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.Unauthorized, message, detail);
    }

    public static ResultError Unauthorized(string code, string message, string detail)
    {
        return new ResultError(code, message, detail);
    }

    public static ResultError Forbidden(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.Forbidden, message, detail);
    }

    public static ResultError NotFound(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.NotFound, message, detail);
    }

    public static ResultError Conflict(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.Conflict, message, detail);
    }

    public static ResultError Server(string message, string detail)
    {
        return new ResultError(ApiErrorCodes.Server, message, detail);
    }
}
