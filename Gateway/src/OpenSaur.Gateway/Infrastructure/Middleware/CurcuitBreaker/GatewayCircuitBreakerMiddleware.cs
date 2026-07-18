using OpenSaur.Gateway.Infrastructure;

namespace OpenSaur.Gateway.Infrastructure.Middleware.CurcuitBreaker;

sealed class GatewayCircuitBreakerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly GatewayCircuitBreaker _gatewayCircuitBreaker;
    private readonly ILogger<GatewayCircuitBreakerMiddleware> _logger;

    public GatewayCircuitBreakerMiddleware(
        RequestDelegate next,
        GatewayCircuitBreaker gatewayCircuitBreaker,
        ILogger<GatewayCircuitBreakerMiddleware> logger)
    {
        _next = next;
        _gatewayCircuitBreaker = gatewayCircuitBreaker;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_gatewayCircuitBreaker.TryRejectRequest(out var retryAfter))
        {
            var retryAfterSeconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.Headers.RetryAfter = retryAfterSeconds.ToString();

            _logger.LogWarning(
                "Gateway circuit breaker open. Rejecting request. Host: {Host}; Path: {Path}; RetryAfterSeconds: {RetryAfterSeconds}",
                context.Request.Host.Value,
                context.Request.Path.Value,
                retryAfterSeconds);
            return;
        }

        await _next(context);
        _gatewayCircuitBreaker.ReportResult(context.Response.StatusCode);
    }
}
