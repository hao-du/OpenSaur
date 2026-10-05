using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.Brainbubby.Web.Features.Auth;
using OpenSaur.Brainbubby.Web.Features.Auth.Refresh;
using OpenSaur.Brainbubby.Web.Features.Profile;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Validations;
using OpenSaur.Brainbubby.Web.Features.Projects;
using OpenSaur.Brainbubby.Web.Features.Projects.Dtos;
using OpenSaur.Brainbubby.Web.Features.Projects.Validations;
using OpenSaur.Brainbubby.Web.Features.Nodes;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;
using OpenSaur.Brainbubby.Web.Features.Nodes.Validations;
using OpenSaur.Brainbubby.Web.Features.Settings;
using OpenSaur.Brainbubby.Web.Features.Snapshots;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Services;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Validations;
using OpenSaur.Brainbubby.Web.Features.SharedFiles;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Dtos;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Services;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Validations;
using OpenSaur.Brainbubby.Web.Features.Templates;
using OpenSaur.Brainbubby.Web.Features.Templates.Dtos;
using OpenSaur.Brainbubby.Web.Features.Templates.Validations;
using OpenSaur.Brainbubby.Web.Infrastructure.Auth;
using OpenSaur.Brainbubby.Web.Infrastructure.ConfigurationOptions;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Messaging;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// Security & Claim Services
builder.Services.AddSingleton<IClaimService, ClaimService>();

// FluentValidation Validators
builder.Services.AddScoped<IValidator<CreateProjectRequest>, CreateProjectRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProjectRequest>, UpdateProjectRequestValidator>();
builder.Services.AddScoped<IValidator<AssignProjectPermissionRequest>, AssignProjectPermissionRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProjectPermissionRequest>, UpdateProjectPermissionRequestValidator>();
builder.Services.AddScoped<IValidator<CreateNodeRequest>, CreateNodeRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateNodeRequest>, UpdateNodeRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateNodeContentRequest>, UpdateNodeContentRequestValidator>();
builder.Services.AddScoped<IValidator<CreateSnapshotRequest>, CreateSnapshotRequestValidator>();
builder.Services.AddScoped<IValidator<CreateTemplateRequest>, CreateTemplateRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateTemplateRequest>, UpdateTemplateRequestValidator>();
builder.Services.AddScoped<IValidator<ShareFileRequest>, ShareFileRequestValidator>();

// Node Tree Service
builder.Services.AddScoped<INodeTreeService, NodeTreeService>();

// Snapshot Service
builder.Services.AddScoped<ISnapshotService, SnapshotService>();

// Shared File Service
builder.Services.AddScoped<ISharedFileService, SharedFileService>();

// MCP Services and Tools
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<OpenSaur.Brainbubby.Web.Features.Mcp.Services.IMcpContextService, OpenSaur.Brainbubby.Web.Features.Mcp.Services.McpContextService>();
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithTools<OpenSaur.Brainbubby.Web.Features.Mcp.Tools.McpReadTools>()
    .WithTools<OpenSaur.Brainbubby.Web.Features.Mcp.Tools.McpNodeMutationTools>()
    .WithTools<OpenSaur.Brainbubby.Web.Features.Mcp.Tools.McpSnapshotMutationTools>();

// Database
builder.Services.AddDbContext<BrainbubbyDbContext>(options =>
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
builder.Services.AddHttpClient(BrainbubbyTokenService.HttpClientName, client =>
{
    if (!string.IsNullOrWhiteSpace(oidcOptions.Authority))
    {
        client.BaseAddress = new Uri(oidcOptions.Authority);
    }
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
});

builder.Services.AddScoped<ITokenService, BrainbubbyTokenService>();
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
    options.Cookie.Name = "Brainbubby-s";
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

});

// Kafka User & Workspace Sync Background Service
builder.Services.AddHostedService<KafkaUserSyncConsumerService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.Use(async (context, next) =>
{
    if (context.Request.Path == "/" || context.Request.Path == "")
    {
        context.Request.Path = "/index.html";
    }
    await next();
});
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "OpenSaur.Brainbubby.Web" }))
   .WithName("HealthCheck");

app.MapAuthEndpoints();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapProjectEndpoints();
app.MapProjectPermissionEndpoints();
app.MapNodeEndpoints();
app.MapSnapshotEndpoints();
app.MapTemplateEndpoints();
app.MapSharedFilesEndpoints();
app.MapMcp("/mcp").RequireAuthorization(AuthConstants.Policies.RequireAuthenticatedUser);

// Map SPA fallback routes
app.MapGet("/", (IWebHostEnvironment env) => Results.File(
    Path.Combine(env.WebRootPath, "index.html"),
    "text/html; charset=utf-8")).AllowAnonymous();

app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();
