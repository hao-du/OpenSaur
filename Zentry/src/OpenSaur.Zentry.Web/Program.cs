using FluentValidation;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.Zentry.Web.Features.Frontend.Handlers;
using OpenSaur.Zentry.Web.Features.OidcClients;
using OpenSaur.Zentry.Web.Features.OidcClients.CreateOidcClient;
using OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Hosting;

var builder = WebApplication.CreateBuilder(args);
var oidcOptions = builder.Configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>()
    ?? throw new InvalidOperationException("OIDC configuration is required.");
var connectionString = builder.Configuration.GetConnectionString("ZentryDb")
    ?? throw new InvalidOperationException("ConnectionStrings:ZentryDb is required.");

builder.Services.Configure<OidcOptions>(
    builder.Configuration.GetSection(OidcOptions.SectionName));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CreateAppConfigJsHandler>();
builder.Services.AddScoped<CreateFrontendRouteHandler>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.UseOpenIddict<Guid>();
});
builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
            .UseDbContext<ApplicationDbContext>()
            .ReplaceDefaultEntities<Guid>();
    })
    .AddValidation(options =>
    {
        options.SetIssuer(oidcOptions.Authority);
        options.AddAudiences("api");
        options.UseSystemNetHttp(systemNetHttp =>
        {
            if (builder.Environment.IsDevelopment()
                && Uri.TryCreate(oidcOptions.Authority, UriKind.Absolute, out var authorityUri)
                && string.Equals(authorityUri.Host, "localhost", StringComparison.OrdinalIgnoreCase))
            {
                systemNetHttp.ConfigureHttpClientHandler(handler =>
                {
                    handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
                });
            }
        });
        options.UseAspNetCore();
    });
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});
builder.Services.AddAuthorization(SuperAdminAuthorization.ConfigurePolicy);
builder.Services.AddScoped<IValidator<CreateOidcClientRequest>, CreateOidcClientRequestValidator>();
builder.Services.AddScoped<IValidator<EditOidcClientRequest>, EditOidcClientRequestValidator>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapOidcClientEndpoints();
app.MapFrontEndRoutes();

app.Run();

public partial class Program;
