using Microsoft.AspNetCore.HttpOverrides;

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

app.MapReverseProxy();

app.Run();
