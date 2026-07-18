using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.CashPilot.Web.Features.Banks;
using OpenSaur.CashPilot.Web.Features.Counterparties;
using OpenSaur.CashPilot.Web.Features.Currencies;
using OpenSaur.CashPilot.Web.Features.Currencies.Services;
using OpenSaur.CashPilot.Web.Features.Frontend;
using OpenSaur.CashPilot.Web.Features.Frontend.Handlers;
using OpenSaur.CashPilot.Web.Features.PendingTransactions;
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

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendOrigins", policy =>
    {
        policy.WithOrigins(
                "https://cashpilot.duchihao.com",
                "https://off.cashpilot.duchihao.com",
                "https://localhost:5031",
                "https://localhost:5032",
                "http://localhost:5174",
                "https://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthorization(AppAuthorization.ConfigurePolicies);
builder.Services.AddScoped<CreateFrontendRouteHandler>();
builder.Services.AddScoped<CreateAppConfigJsHandler>();
builder.Services.AddScoped<SideMenuService>();
builder.Services.AddScoped<TagService>();
builder.Services.AddScoped<CurrencyService>();
builder.Services.AddScoped<BankAccountMovementService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddProblemDetails();

// Register Redis as the distributed cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
});

// HybridCache now uses Redis for distributed layer + MemoryCache for local layer
builder.Services.AddHybridCache();
builder.Services.AddSingleton<IHybridCacheService, HybridCacheService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseClientAbortedRequestHandling();
app.UseSecurityHeaders(oidcOptions, app.Environment);
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("FrontendOrigins");
app.UseAuthentication();
app.UseAuthorization();

// Map the custom frontend routes
app.MapFrontEndRoutes();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapBanksEndpoints();
app.MapCounterpartiesEndpoints();
app.MapCurrenciesEndpoints();
app.MapPendingTransactionsEndpoints();
app.MapTransactionsEndpoints();
app.MapTemplatesEndpoints();
app.MapTagsEndpoints();
app.MapReportsEndpoints();

app.Run();
