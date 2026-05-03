using System.Net;
using System.Threading.RateLimiting;
using OpenSaur.Gateway.ConfigurationOptions;
using OpenSaur.Gateway.Infrastructure;
using OpenSaur.Gateway.Infrastructure.Middleware.CurcuitBreaker;
using OpenSaur.Gateway.Infrastructure.Middleware.DirectForwarding;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Yarp.ReverseProxy.Forwarder;

var builder = WebApplication.CreateBuilder(args);
var rateLimitOptions = builder.Configuration.GetSection("Gateway:RateLimiting").Get<GatewayRateLimitingOptions>() ?? new GatewayRateLimitingOptions();
var circuitBreakerOptions = builder.Configuration.GetSection("Gateway:CircuitBreaker").Get<GatewayCircuitBreakerOptions>() ?? new GatewayCircuitBreakerOptions();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedHost |
        ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            remoteIp,
            _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = rateLimitOptions.PermitLimit,
                QueueLimit = rateLimitOptions.QueueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                Window = TimeSpan.FromSeconds(rateLimitOptions.WindowSeconds)
            });
    });
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
builder.Services.AddSingleton(new GatewayCircuitBreaker(circuitBreakerOptions));

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

builder.Services.AddSingleton(new DirectForwardingContext
{
    Hosts = directForwardingHosts,
    ForwarderHttpClient = forwarderHttpClient,
    ForwarderRequestConfig = forwarderRequestConfig
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseRateLimiter();
app.UseCircuitBreaker();
app.UseDirectForwarding();

app.MapReverseProxy();

app.Run();

static string? ResolveClusterAddress(IConfiguration configuration, string clusterId)
{
    var destinations = configuration.GetSection($"ReverseProxy:Clusters:{clusterId}:Destinations").GetChildren();
    return destinations
        .Select(destination => destination["Address"])
        .FirstOrDefault(address => !string.IsNullOrWhiteSpace(address));
}
