using Microsoft.AspNetCore.Http;

namespace OpenSaur.Identity.Web.Infrastructure.Results;

public class Result
{
    protected Result(bool isSuccess, int statusCode, IReadOnlyList<ResultError> errors)
    {
        IsSuccess = isSuccess;
        StatusCode = statusCode;
        Errors = errors;
    }

    public bool IsSuccess { get; }

    public int StatusCode { get; }

    public IReadOnlyList<ResultError> Errors { get; }

    public static Result Success()
    {
        return new Result(true, StatusCodes.Status200OK, []);
    }

    public static Result Failure(int statusCode, params ResultError[] errors)
    {
        return new Result(false, statusCode, errors);
    }

    public static Result Failure(int statusCode, IReadOnlyList<ResultError> errors)
    {
        return new Result(false, statusCode, errors);
    }

    public static Result Validation(params ResultError[] errors)
    {
        return Failure(StatusCodes.Status400BadRequest, errors);
    }

    public static Result Unauthorized(string message, string detail)
    {
        return Failure(StatusCodes.Status401Unauthorized, ResultErrors.Unauthorized(message, detail));
    }

    public static Result Unauthorized(string code, string message, string detail)
    {
        return Failure(StatusCodes.Status401Unauthorized, ResultErrors.Unauthorized(code, message, detail));
    }

    public static Result Forbidden(string message, string detail)
    {
        return Failure(StatusCodes.Status403Forbidden, ResultErrors.Forbidden(message, detail));
    }

    public static Result NotFound(string message, string detail)
    {
        return Failure(StatusCodes.Status404NotFound, ResultErrors.NotFound(message, detail));
    }

    public static Result Conflict(string message, string detail)
    {
        return Failure(StatusCodes.Status409Conflict, ResultErrors.Conflict(message, detail));
    }
}

public sealed class Result<T> : Result
{
    private Result(T? value, bool isSuccess, int statusCode, IReadOnlyList<ResultError> errors)
        : base(isSuccess, statusCode, errors)
    {
        Value = value;
    }

    public T? Value { get; }

    public static Result<T> Success(T value)
    {
        return new Result<T>(value, true, StatusCodes.Status200OK, []);
    }

    public static new Result<T> Failure(int statusCode, params ResultError[] errors)
    {
        return new Result<T>(default, false, statusCode, errors);
    }

    public static new Result<T> Failure(int statusCode, IReadOnlyList<ResultError> errors)
    {
        return new Result<T>(default, false, statusCode, errors);
    }

    public static new Result<T> Validation(params ResultError[] errors)
    {
        return Failure(StatusCodes.Status400BadRequest, errors);
    }

    public static new Result<T> Unauthorized(string message, string detail)
    {
        return Failure(StatusCodes.Status401Unauthorized, ResultErrors.Unauthorized(message, detail));
    }

    public static new Result<T> Unauthorized(string code, string message, string detail)
    {
        return Failure(StatusCodes.Status401Unauthorized, ResultErrors.Unauthorized(code, message, detail));
    }

    public static new Result<T> Forbidden(string message, string detail)
    {
        return Failure(StatusCodes.Status403Forbidden, ResultErrors.Forbidden(message, detail));
    }

    public static new Result<T> NotFound(string message, string detail)
    {
        return Failure(StatusCodes.Status404NotFound, ResultErrors.NotFound(message, detail));
    }

    public static new Result<T> Conflict(string message, string detail)
    {
        return Failure(StatusCodes.Status409Conflict, ResultErrors.Conflict(message, detail));
    }
}
