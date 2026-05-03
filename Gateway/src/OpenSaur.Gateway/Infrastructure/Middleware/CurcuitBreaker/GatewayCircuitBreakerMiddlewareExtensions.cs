namespace OpenSaur.Gateway.Infrastructure.Middleware.CurcuitBreaker;

static class GatewayCircuitBreakerMiddlewareExtensions
{
    public static IApplicationBuilder UseCircuitBreaker(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GatewayCircuitBreakerMiddleware>();
    }
}
