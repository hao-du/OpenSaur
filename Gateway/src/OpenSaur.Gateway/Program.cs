var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.Use(async (context, next) =>
{
    app.Logger.LogInformation(
        "Gateway request received. Host: {Host}; Path: {Path}",
        context.Request.Host.Value,
        context.Request.Path.Value);

    await next();
});

app.MapReverseProxy();

app.Run();
