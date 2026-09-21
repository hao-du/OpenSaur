using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using OpenIddict.Abstractions;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.Zentry.Web.Features.Bff;
using OpenSaur.Zentry.Web.Features.Bff.Refresh;
using OpenSaur.Zentry.Web.Features.Dashboard;
using OpenSaur.Zentry.Web.Features.OidcClients;
using OpenSaur.Zentry.Web.Features.OidcClients.CreateOidcClient;
using OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;
using OpenSaur.Zentry.Web.Features.Permissions;
using OpenSaur.Zentry.Web.Features.Profile;
using OpenSaur.Zentry.Web.Features.Roles;
using OpenSaur.Zentry.Web.Features.Roles.CreateRole;
using OpenSaur.Zentry.Web.Features.Roles.EditRole;
using OpenSaur.Zentry.Web.Features.Settings;
using OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;
using OpenSaur.Zentry.Web.Features.Users;
using OpenSaur.Zentry.Web.Features.Users.CreateUser;
using OpenSaur.Zentry.Web.Features.Users.EditUser;
using OpenSaur.Zentry.Web.Features.Users.ResetUserPassword;
using OpenSaur.Zentry.Web.Features.Workspaces;
using OpenSaur.Zentry.Web.Features.Workspaces.CreateWorkspace;
using OpenSaur.Zentry.Web.Infrastructure.Lock;
using OpenSaur.Zentry.Web.Infrastructure.Cache;
using OpenSaur.Zentry.Web.Features.Workspaces.EditWorkspace;
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
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    var multiplexer = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnectionString);
    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(multiplexer);
    builder.Services.AddStackExchangeRedisCache(options => options.Configuration = redisConnectionString);
    builder.Services.AddSingleton<ILockService, RedisDistributedLockService>();
}
else
{
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSingleton<ILockService, MemoryLockService>();
}
builder.Services.AddHybridCache(options =>
{
    // Keep local in-memory L1 cache short (15s) so other instances pick up L2 (Redis) changes quickly
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        LocalCacheExpiration = TimeSpan.FromSeconds(15)
    };
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient("CoreGateTokenClient")
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        var handler = new HttpClientHandler();
        if (builder.Environment.IsDevelopment())
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }
        return handler;
    });
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddScoped<ITokenService, CoreGateTokenService>();
builder.Services.AddScoped<BffTokenRefreshCookieEvents>();
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
            systemNetHttp.ConfigureHttpClientHandler(handler =>
            {
                handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            });
        });
        options.UseAspNetCore();
    });
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = BffConstants.DefaultCookieScheme;
    options.DefaultAuthenticateScheme = BffConstants.DefaultCookieScheme;
    options.DefaultSignInScheme = BffConstants.DefaultCookieScheme;
    options.DefaultChallengeScheme = BffConstants.DefaultCookieScheme;
})
.AddCookie(BffConstants.DefaultCookieScheme, options =>
{
    options.Cookie.Name = "__Host-zentry-bff";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Path = "/";
    options.SlidingExpiration = true;
    options.EventsType = typeof(BffTokenRefreshCookieEvents);
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
})
.AddOpenIdConnect(BffConstants.DefaultOidcScheme, options =>
{
    options.SignInScheme = BffConstants.DefaultCookieScheme;
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

    options.Events.OnRedirectToIdentityProvider = context =>
    {
        if (context.Properties.Items.TryGetValue(CoreGateClaimTypes.ImpersonatedUserId, out var impersonatedUserId)
            && !string.IsNullOrWhiteSpace(impersonatedUserId))
        {
            context.ProtocolMessage.SetParameter(CoreGateClaimTypes.ImpersonatedUserId, impersonatedUserId);
        }

        if (context.Properties.Items.TryGetValue(CoreGateClaimTypes.WorkspaceId, out var workspaceId)
            && !string.IsNullOrWhiteSpace(workspaceId))
        {
            context.ProtocolMessage.SetParameter(CoreGateClaimTypes.WorkspaceId, workspaceId);
        }

        return Task.CompletedTask;
    };

    if (builder.Environment.IsDevelopment())
    {
        options.RequireHttpsMetadata = false;
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
        options.BackchannelHttpHandler = handler;
    }
});
builder.Services.AddAuthorization(AppAuthorization.ConfigurePolicies);
builder.Services.AddScoped<IValidator<CreateOidcClientRequest>, CreateOidcClientRequestValidator>();
builder.Services.AddScoped<IValidator<EditOidcClientRequest>, EditOidcClientRequestValidator>();
builder.Services.AddScoped<IValidator<CreateWorkspaceRequest>, CreateWorkspaceRequestValidator>();
builder.Services.AddScoped<IValidator<EditWorkspaceRequest>, EditWorkspaceRequestValidator>();
builder.Services.AddScoped<IValidator<CreateRoleRequest>, CreateRoleRequestValidator>();
builder.Services.AddScoped<IValidator<EditRoleRequest>, EditRoleRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateSettingsRequest>, UpdateSettingsRequestValidator>();
builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserRequestValidator>();
builder.Services.AddScoped<IValidator<EditUserRequest>, EditUserRequestValidator>();
builder.Services.AddScoped<IValidator<ResetUserPasswordRequest>, ResetUserPasswordRequestValidator>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<SideMenuService>();
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseClientAbortedRequestHandling();
app.UseSecurityHeaders(oidcOptions, app.Environment);
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapOidcClientEndpoints();
app.MapWorkspaceEndpoints();
app.MapDashboardEndpoints();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapRoleEndpoints();
app.MapUserEndpoints();
app.MapPermissionEndpoints();
app.MapBffEndpoints();
app.MapFrontEndRoutes();

app.Run();

public partial class Program;
