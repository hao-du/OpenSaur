using Microsoft.AspNetCore.HttpOverrides;
using OpenSaur.CoreGate.Web.Features.Auth;
using OpenSaur.CoreGate.Web.Features.Auth.DependencyInjection;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;
using OpenSaur.CoreGate.Web.Infrastructure.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
        | ForwardedHeaders.XForwardedProto
        | ForwardedHeaders.XForwardedHost;

    // CoreGate runs behind ACA ingress where forwarded headers carry the public URL.
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCoreGateConfiguration(builder.Configuration);
builder.Services.AddCoreGateDatabase(builder.Configuration);
builder.Services.AddCoreGateAuthentication(builder.Configuration);
builder.Services.AddHttpClient(TokenService.HttpClientName, client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddAuthFeature();

builder.Services.AddCors(options =>
{
    var corsOptions = builder.Configuration
        .GetRequiredSection(CorsOptions.SectionName)
        .Get<CorsOptions>();
    var allowedOrigins = corsOptions?.AllowedOrigins ?? [];

    options.AddPolicy("AppCors", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddProblemDetails();
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseClientAbortedRequestHandling();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AppCors");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapOpenIddictEndpoints();
app.MapAuthEndpoints();
app.MapFallbackToFile("index.html");

app.Run();

