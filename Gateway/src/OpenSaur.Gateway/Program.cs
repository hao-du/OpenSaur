using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Yarp.ReverseProxy.Forwarder;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedHost |
        ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
var forwarder = app.Services.GetRequiredService<IHttpForwarder>();

var directForwardingHosts = builder.Configuration
    .GetSection("GatewayDirectForwarding:Hosts")
    .GetChildren()
    .Where(section => !string.IsNullOrWhiteSpace(section.Key) && !string.IsNullOrWhiteSpace(section.Value))
    .ToDictionary(
        section => section.Key,
        section => ResolveClusterAddress(builder.Configuration, section.Value!),
        StringComparer.OrdinalIgnoreCase);

var forwarderHttpClient = new HttpMessageInvoker(new SocketsHttpHandler
{
    UseProxy = false,
    AllowAutoRedirect = false,
    AutomaticDecompression = DecompressionMethods.None,
    UseCookies = false,
    EnableMultipleHttp2Connections = true,
    ConnectTimeout = TimeSpan.FromSeconds(15)
});

var forwarderRequestConfig = new ForwarderRequestConfig
{
    ActivityTimeout = TimeSpan.FromSeconds(100)
};

app.UseForwardedHeaders();

app.Use(async (context, next) =>
{
    app.Logger.LogInformation(
        "Gateway request received. Host: {Host}; X-Forwarded-Host: {ForwardedHost}; Path: {Path}",
        context.Request.Host.Value,
        context.Request.Headers["X-Forwarded-Host"].ToString(),
        context.Request.Path.Value);

    await next();
});

app.Use(async (context, next) =>
{
    directForwardingHosts.TryGetValue(context.Request.Host.Host, out var destinationPrefix);

    if (destinationPrefix is null)
    {
        await next();
        return;
    }

    app.Logger.LogInformation(
        "Direct-forwarding request. Host: {Host}; Path: {Path}; Destination: {Destination}",
        context.Request.Host.Value,
        context.Request.Path.Value,
        destinationPrefix);

    var error = await forwarder.SendAsync(
        context,
        destinationPrefix,
        forwarderHttpClient,
        forwarderRequestConfig,
        HttpTransformer.Default);

    if (error != ForwarderError.None && !context.Response.HasStarted)
    {
        app.Logger.LogError(
            "Direct forwarding failed. Host: {Host}; Path: {Path}; Error: {Error}",
            context.Request.Host.Value,
            context.Request.Path.Value,
            error);

        context.Response.StatusCode = StatusCodes.Status502BadGateway;
    }
});

app.MapReverseProxy();

app.Run();

static string? ResolveClusterAddress(IConfiguration configuration, string clusterId)
{
    var destinations = configuration.GetSection($"ReverseProxy:Clusters:{clusterId}:Destinations").GetChildren();
    return destinations
        .Select(destination => destination["Address"])
        .FirstOrDefault(address => !string.IsNullOrWhiteSpace(address));
}
