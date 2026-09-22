using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.CashPilot.Web.Features.Banks;
using OpenSaur.CashPilot.Web.Features.Auth;
using OpenSaur.CashPilot.Web.Features.Auth.Refresh;
using OpenSaur.CashPilot.Web.Features.Auth.Session;
using OpenSaur.CashPilot.Web.Features.Counterparties;
using OpenSaur.CashPilot.Web.Features.Currencies;
using OpenSaur.CashPilot.Web.Features.Currencies.Services;
using OpenSaur.CashPilot.Web.Features.Frontend;
using OpenSaur.CashPilot.Web.Features.Profile;
using OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;
using OpenSaur.CashPilot.Web.Features.Reports;
using OpenSaur.CashPilot.Web.Features.Reports.Services;
using OpenSaur.CashPilot.Web.Features.Settings;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Templates;
using OpenSaur.CashPilot.Web.Features.Transactions;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Hosting;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Lock;
using Microsoft.Extensions.Caching.StackExchangeRedis;

var builder = WebApplication.CreateBuilder(args);
var oidcOptions = builder.Configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>()
    ?? throw new InvalidOperationException("OIDC configuration is required.");
var connectionString = builder.Configuration.GetConnectionString("CashPilotDb")
    ?? throw new InvalidOperationException("ConnectionStrings:CashPilotDb is required.");

builder.Services.AddDbContext<CashPilotDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

builder.Services.AddHttpContextAccessor();
builder.Services.Configure<OidcOptions>(builder.Configuration.GetSection("Oidc"));
builder.Services.Configure<AutoTaggingOptions>(builder.Configuration.GetSection(AutoTaggingOptions.SectionName));
builder.Services.AddHttpClient<TransactionAutoTagService>();
builder.Services.AddHttpClient(CashPilotTokenService.HttpClientName)
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        var handler = new HttpClientHandler();
        if (builder.Environment.IsDevelopment())
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
        }
        return handler;
    });
builder.Services.AddScoped<OpenSaur.CashPilot.Web.Infrastructure.Auth.ITokenService, CashPilotTokenService>();
builder.Services.AddScoped<AuthTokenRefreshCookieEvents>();

builder.Services.AddOpenIddict()
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

builder.Services.AddSingleton<ITicketStore, UserSessionCookieStore>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultAuthenticateScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultSignInScheme = AuthConstants.DefaultCookieScheme;
    options.DefaultChallengeScheme = AuthConstants.DefaultCookieScheme;
})
.AddCookie(AuthConstants.DefaultCookieScheme, options =>
{
    options.Cookie.Name = "cashpilot-s";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Path = "/";
    options.SlidingExpiration = true;
    options.EventsType = typeof(AuthTokenRefreshCookieEvents);
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
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
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
        options.BackchannelHttpHandler = handler;
    }
});

builder.Services.AddOptions<Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationOptions>(AuthConstants.DefaultCookieScheme)
    .Configure<ITicketStore>((options, sessionStore) =>
    {
        options.SessionStore = sessionStore;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendOrigins", policy =>
    {
        policy.WithOrigins(
                "https://cashpilot.duchihao.com",
                "https://localhost:5031",
                "http://localhost:5174",
                "https://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthorization(AppAuthorization.ConfigurePolicies);
builder.Services.AddScoped<SideMenuService>();
builder.Services.AddScoped<TagService>();
builder.Services.AddScoped<CurrencyService>();
builder.Services.AddScoped<BankAccountMovementService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<ITransactionCacheInvalidator, TransactionCacheInvalidator>();
builder.Services.AddProblemDetails();


builder.Services.AddHybridCache(options =>
{
    // Keep local in-memory L1 cache short (15s) so other instances pick up L2 (Redis) changes quickly
    options.DefaultEntryOptions = new Microsoft.Extensions.Caching.Hybrid.HybridCacheEntryOptions
    {
        LocalCacheExpiration = TimeSpan.FromSeconds(15)
    };
});

builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddSingleton<IHybridCacheService>(sp => (CacheService)sp.GetRequiredService<ICacheService>());

var app = builder.Build();

app.UseExceptionHandler();
app.UseClientAbortedRequestHandling();
app.UseSecurityHeaders(oidcOptions, app.Environment);
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("FrontendOrigins");
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapBanksEndpoints();
app.MapCounterpartiesEndpoints();
app.MapCurrenciesEndpoints();
app.MapTransactionsEndpoints();
app.MapTemplatesEndpoints();
app.MapTagsEndpoints();
app.MapReportsEndpoints();

// Map the custom frontend routes (after API endpoints so fallback doesn't intercept API routes)
app.MapFrontEndRoutes();

app.Run();
