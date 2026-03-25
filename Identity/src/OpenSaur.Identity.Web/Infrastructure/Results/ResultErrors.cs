namespace OpenSaur.Identity.Web.Infrastructure.Results;

public static class ResultErrors
{
    public static ResultError Validation(string message, string detail)
    {
        return new ResultError("validation_error", message, detail);
    }

    public static ResultError Unauthorized(string message, string detail)
    {
        return new ResultError("unauthorized", message, detail);
    }

    public static ResultError Forbidden(string message, string detail)
    {
        return new ResultError("forbidden", message, detail);
    }

    public static ResultError NotFound(string message, string detail)
    {
        return new ResultError("not_found", message, detail);
    }

    public static ResultError Conflict(string message, string detail)
    {
        return new ResultError("conflict", message, detail);
    }

    public static ResultError Server(string message, string detail)
    {
        return new ResultError("server_error", message, detail);
    }
}
