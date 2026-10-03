using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.RuleAgent.Web.Features.Auth;
using OpenSaur.RuleAgent.Web.Features.Auth.Refresh;
using OpenSaur.RuleAgent.Web.Features.Profile;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Validations;
using OpenSaur.RuleAgent.Web.Features.Projects;
using OpenSaur.RuleAgent.Web.Features.Projects.Dtos;
using OpenSaur.RuleAgent.Web.Features.Projects.Validations;
using OpenSaur.RuleAgent.Web.Features.Settings;
using OpenSaur.RuleAgent.Web.Infrastructure.Auth;
using OpenSaur.RuleAgent.Web.Infrastructure.ConfigurationOptions;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Messaging;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// Security & Claim Services
builder.Services.AddSingleton<IClaimService, ClaimService>();

// FluentValidation Validators
builder.Services.AddScoped<IValidator<CreateProjectRequest>, CreateProjectRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProjectRequest>, UpdateProjectRequestValidator>();
builder.Services.AddScoped<IValidator<AssignProjectPermissionRequest>, AssignProjectPermissionRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProjectPermissionRequest>, UpdateProjectPermissionRequestValidator>();

// Database
builder.Services.AddDbContext<RuleAgentDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuration
var oidcOptions = builder.Configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>() ?? new OidcOptions();
builder.Services.Configure<OidcOptions>(builder.Configuration.GetSection(OidcOptions.SectionName));

builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection(KafkaOptions.SectionName));

// OpenIddict Validation (for Bearer tokens issued by Zentry)
builder.Services.AddOpenIddict()
    .AddValidation(options =>
    {
        if (!string.IsNullOrWhiteSpace(oidcOptions.Authority))
        {
            options.SetIssuer(oidcOptions.Authority);
        }

        options.AddAudiences("api");
        options.UseSystemNetHttp(systemNetHttp =>
        {
            systemNetHttp.ConfigureHttpClientHandler(handler =>
            {
                handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            });
        });
        options.UseAspNetCore();
    });

// Token Refresh Services
builder.Services.AddHttpClient(RuleAgentTokenService.HttpClientName, client =>
{
    if (!string.IsNullOrWhiteSpace(oidcOptions.Authority))
    {
        client.BaseAddress = new Uri(oidcOptions.Authority);
    }
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
});

builder.Services.AddScoped<ITokenService, RuleAgentTokenService>();
builder.Services.AddScoped<AuthTokenRefreshCookieEvents>();

// Cookie + OIDC Authentication (for Web UI)
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultAuthenticateScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultSignInScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultChallengeScheme = AuthConstants.DefaultCookieScheme;
})
.AddCookie(AuthConstants.DefaultCookieScheme, options =>
{
    options.Cookie.Name = "ruleagent-s";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Path = "/";
    options.SlidingExpiration = true;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.EventsType = typeof(AuthTokenRefreshCookieEvents);
})
.AddOpenIdConnect(AuthConstants.DefaultOidcScheme, options =>
{
    options.SignInScheme = AuthConstants.DefaultCookieScheme;
    options.Authority = oidcOptions.Authority;
    options.ClientId = oidcOptions.ClientId;
    if (!string.IsNullOrWhiteSpace(oidcOptions.ClientSecret))
    {
        options.ClientSecret = oidcOptions.ClientSecret;
    }

    options.ResponseType = "code";
    options.ResponseMode = "query";
    options.UsePkce = true;
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;

    options.Scope.Clear();
    foreach (var scope in oidcOptions.Scope.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        options.Scope.Add(scope);
    }

    options.CallbackPath = oidcOptions.RedirectPath;
    options.SignedOutCallbackPath = oidcOptions.PostLogoutRedirectPath;

    if (builder.Environment.IsDevelopment())
    {
        options.RequireHttpsMetadata = false;
        options.BackchannelHttpHandler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
    }
});

// Authorization policies supporting both Cookie and OpenIddict Bearer
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthConstants.Policies.RequireAuthenticatedUser, policy =>
    {
        policy.AddAuthenticationSchemes(
            AuthConstants.DefaultCookieScheme,
            OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
    });

    options.AddPolicy(AuthConstants.Policies.RequireSuperAdministrator, policy =>
    {
        policy.AddAuthenticationSchemes(
            AuthConstants.DefaultCookieScheme,
            OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
        policy.RequireRole(AuthConstants.Roles.SuperAdministrator);
    });

    // Default policy
    options.DefaultPolicy = options.GetPolicy(AuthConstants.Policies.RequireAuthenticatedUser)!;
});

// Kafka User & Workspace Sync Background Service
builder.Services.AddHostedService<KafkaUserSyncConsumerService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "OpenSaur.RuleAgent.Web" }))
   .WithName("HealthCheck");

app.MapAuthEndpoints();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapProjectEndpoints();
app.MapProjectPermissionEndpoints();

app.Run();
