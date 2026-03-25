using Microsoft.AspNetCore.Diagnostics;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public static class ApiStatusCodeResponseWriter
{
    public static Task TryWriteAsync(StatusCodeContext statusCodeContext)
    {
        var httpContext = statusCodeContext.HttpContext;
        if (!ApiRequestClassifier.IsApiRequest(httpContext.Request))
        {
            return Task.CompletedTask;
        }

        var result = httpContext.Response.StatusCode switch
        {
            StatusCodes.Status401Unauthorized => ApiResponses.Error(
                StatusCodes.Status401Unauthorized,
                [ResultErrors.Unauthorized(
                    "Authentication is required.",
                    "The request requires a valid authenticated API session or bearer token.")]),
            StatusCodes.Status403Forbidden => ApiResponses.Error(
                StatusCodes.Status403Forbidden,
                [ResultErrors.Forbidden(
                    "Access is forbidden.",
                    "You do not have permission to perform this action.")]),
            StatusCodes.Status404NotFound => ApiResponses.Error(
                StatusCodes.Status404NotFound,
                [ResultErrors.NotFound(
                    "Resource not found.",
                    "The requested API resource could not be found.")]),
            _ => null
        };

        return result is null
            ? Task.CompletedTask
            : result.ExecuteAsync(httpContext);
    }
}
