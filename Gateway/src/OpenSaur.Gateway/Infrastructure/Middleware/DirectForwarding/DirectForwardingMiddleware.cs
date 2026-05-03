using Yarp.ReverseProxy.Forwarder;

namespace OpenSaur.Gateway.Infrastructure.Middleware.DirectForwarding;

sealed class DirectForwardingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly DirectForwardingContext _directForwardingContext;
    private readonly IHttpForwarder _forwarder;
    private readonly ILogger<DirectForwardingMiddleware> _logger;

    public DirectForwardingMiddleware(
        RequestDelegate next,
        DirectForwardingContext directForwardingContext,
        IHttpForwarder forwarder,
        ILogger<DirectForwardingMiddleware> logger)
    {
        _next = next;
        _directForwardingContext = directForwardingContext;
        _forwarder = forwarder;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        _directForwardingContext.Hosts.TryGetValue(context.Request.Host.Host, out var destinationPrefix);

        if (destinationPrefix is null)
        {
            await _next(context);
            return;
        }

        _logger.LogInformation(
            "Direct-forwarding request. Host: {Host}; Path: {Path}; Destination: {Destination}",
            context.Request.Host.Value,
            context.Request.Path.Value,
            destinationPrefix);

        var error = await _forwarder.SendAsync(
            context,
            destinationPrefix,
            _directForwardingContext.ForwarderHttpClient,
            _directForwardingContext.ForwarderRequestConfig,
            HttpTransformer.Default);

        if (error != ForwarderError.None && !context.Response.HasStarted)
        {
            _logger.LogError(
                "Direct forwarding failed. Host: {Host}; Path: {Path}; Error: {Error}",
                context.Request.Host.Value,
                context.Request.Path.Value,
                error);

            context.Response.StatusCode = StatusCodes.Status502BadGateway;
        }
    }
}
