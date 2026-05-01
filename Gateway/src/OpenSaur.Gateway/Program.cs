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

var coreGateAddress = builder.Configuration["ReverseProxy:Clusters:coregate:Destinations:coregateApp:Address"];
var zentryAddress = builder.Configuration["ReverseProxy:Clusters:zentry:Destinations:zentryApp:Address"];

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
    var destinationPrefix = context.Request.Host.Host switch
    {
        "coregate.duchihao.com" when !string.IsNullOrWhiteSpace(coreGateAddress) => coreGateAddress,
        "zentry.duchihao.com" when !string.IsNullOrWhiteSpace(zentryAddress) => zentryAddress,
        _ => null
    };

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
