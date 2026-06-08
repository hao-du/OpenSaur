using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.CashPilot.Web.Features.Frontend;
using OpenSaur.CashPilot.Web.Features.Frontend.Handlers;
using OpenSaur.CashPilot.Web.Features.Banks;
using OpenSaur.CashPilot.Web.Features.Counterparties;
using OpenSaur.CashPilot.Web.Features.Currencies;
using OpenSaur.CashPilot.Web.Features.Transactions;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries.Providers;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Features.Templates;
using OpenSaur.CashPilot.Web.Features.Profile;
using OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;
using OpenSaur.CashPilot.Web.Features.Settings;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Auth;
using OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Hosting;

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

builder.Services.AddAuthorization(AppAuthorization.ConfigurePolicies);
builder.Services.AddScoped<CreateFrontendRouteHandler>();
builder.Services.AddScoped<CreateAppConfigJsHandler>();
builder.Services.AddScoped<SideMenuService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<BankAccountMovementManager>();
builder.Services.AddScoped<ITransactionQueryProvider, CashFlowTransactionQueryProvider>();
builder.Services.AddScoped<ITransactionQueryProvider, BankAccountTransactionQueryProvider>();
builder.Services.AddScoped<ITransactionQueryProvider, TransferTransactionQueryProvider>();
builder.Services.AddScoped<ITransactionQueryProvider, CurrencyExchangeTransactionQueryProvider>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseClientAbortedRequestHandling();
app.UseSecurityHeaders(oidcOptions, app.Environment);
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

// Map the custom frontend routes
app.MapFrontEndRoutes();
app.MapProfileEndpoints();
app.MapSettingsEndpoints();
app.MapBanksEndpoints();
app.MapCounterpartiesEndpoints();
app.MapCurrenciesEndpoints();
app.MapTransactionsEndpoints();
app.MapTemplatesEndpoints();
app.MapTagsEndpoints();

app.Run();
