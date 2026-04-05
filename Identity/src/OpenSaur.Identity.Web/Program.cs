using Microsoft.AspNetCore.HttpOverrides;
using OpenSaur.Identity.Web.Infrastructure;
using OpenSaur.Identity.Web.Infrastructure.Hosting;
using OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenSaurInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();
var serveBuiltShell = FrontendAppRoutes.ShouldServeBuiltShell(app.Environment);
var identityPathBase = new PathString("/identity");

using (var scope = app.Services.CreateScope())
{
    var firstPartyOidcClientRegistrar = scope.ServiceProvider.GetRequiredService<FirstPartyOidcClientRegistrar>();
    await firstPartyOidcClientRegistrar.EnsureConfiguredClientAsync();
}

app.UseForwardedHeaders();
app.Use(async (httpContext, next) =>
{
    if (!httpContext.Request.Path.StartsWithSegments(identityPathBase))
    {
        httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    await next();
});
app.UsePathBase(identityPathBase);
app.UseExceptionHandler();

if (serveBuiltShell)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseStatusCodePages(ApiStatusCodeResponseWriter.TryWriteAsync);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseMiddleware<IdempotencyMiddleware>();

app.MapOpenSaurEndpoints();
app.MapShellRuntimeConfig();
if (serveBuiltShell)
{
    app.MapShellRoutes();
}

app.Run();

public partial class Program;
