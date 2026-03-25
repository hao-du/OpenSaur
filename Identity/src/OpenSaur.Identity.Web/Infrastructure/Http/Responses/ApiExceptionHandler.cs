using Microsoft.AspNetCore.Diagnostics;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (!ApiRequestClassifier.IsApiRequest(httpContext.Request))
        {
            return false;
        }

        logger.LogError(exception, "Unhandled exception while processing API request {Method} {Path}.", httpContext.Request.Method, httpContext.Request.Path);

        await ApiResponses.Error(
                Result.Failure(
                    StatusCodes.Status500InternalServerError,
                    ResultErrors.Server(
                        "The request could not be completed.",
                        "An unexpected error occurred while processing the request.")))
            .ExecuteAsync(httpContext);

        return true;
    }
}
