namespace OpenSaur.CoreGate.Web.Infrastructure.Hosting;

public static class RequestCancellationMiddlewareExtensions
{
    public static IApplicationBuilder UseClientAbortedRequestHandling(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            try
            {
                await next();
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                if (!context.Response.HasStarted)
                {
                    context.Response.StatusCode = StatusCodes.Status499ClientClosedRequest;
                }
            }
        });
    }
}
