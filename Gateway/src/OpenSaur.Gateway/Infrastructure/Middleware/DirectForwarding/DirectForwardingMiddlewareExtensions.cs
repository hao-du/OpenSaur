namespace OpenSaur.Gateway.Infrastructure.Middleware.DirectForwarding;

static class DirectForwardingMiddlewareExtensions
{
    public static IApplicationBuilder UseDirectForwarding(this IApplicationBuilder app)
    {
        return app.UseMiddleware<DirectForwardingMiddleware>();
    }
}
