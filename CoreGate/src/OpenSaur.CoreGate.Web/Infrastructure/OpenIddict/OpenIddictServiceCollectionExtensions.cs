using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Infrastructure.OpenIddict;

public static class OpenIddictServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var oidcOptions = configuration.GetRequiredSection(OidcOptions.SectionName).Get<OidcOptions>()
            ?? throw new InvalidOperationException("OIDC configuration is required.");

        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = AuthCookieNames.Session;
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.LoginPath = "/auth/login";
            options.ReturnUrlParameter = "returnUrl";
            options.SlidingExpiration = true;
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = context =>
                {
                    var redirectUri = $"/auth/login?returnUrl={Uri.EscapeDataString(context.Request.PathBase + context.Request.Path + context.Request.QueryString)}";
                    context.Response.Redirect(redirectUri);
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
            });

        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                    .UseDbContext<ApplicationDbContext>()
                    .ReplaceDefaultEntities<Guid>();
            })
            .AddServer(options =>
            {
                options.SetIssuer(new Uri(oidcOptions.GetIssuerBaseUri().AbsoluteUri.TrimEnd('/'), UriKind.Absolute));
                options.SetAuthorizationEndpointUris("connect/authorize");
                options.SetTokenEndpointUris("connect/token");
                options.SetUserInfoEndpointUris("connect/userinfo");
                options.AllowAuthorizationCodeFlow()
                    .AllowRefreshTokenFlow();
                options.RequireProofKeyForCodeExchange();
                options.RegisterScopes(ScopeConstants.Supported);
                options.DisableAccessTokenEncryption();

                if (!string.IsNullOrWhiteSpace(oidcOptions.SigningCertificatePath)
                    && !string.IsNullOrWhiteSpace(oidcOptions.EncryptionCertificatePath))
                {
                    options.AddSigningCertificate(OpenIddictCertificateLoader.LoadCertificate(
                        oidcOptions.SigningCertificatePath,
                        oidcOptions.SigningCertificatePassword));
                    options.AddEncryptionCertificate(OpenIddictCertificateLoader.LoadCertificate(
                        oidcOptions.EncryptionCertificatePath,
                        oidcOptions.EncryptionCertificatePassword));
                }
                else
                {
                    options.AddEphemeralEncryptionKey()
                        .AddEphemeralSigningKey();
                }

                options.UseAspNetCore()
                    .DisableTransportSecurityRequirement()
                    .EnableAuthorizationEndpointPassthrough()
                    .EnableTokenEndpointPassthrough()
                    .EnableUserInfoEndpointPassthrough();
            });

        services.AddScoped<UserAuthorizationDataService>();

        return services;
    }
}
