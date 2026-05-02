using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using OpenSaur.CoreGate.Web.Infrastructure.Database;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Cryptography.X509Certificates;

namespace OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;

public static class OpenIddictServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
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
            options.Cookie.Name = CookieNames.Session;
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.LoginPath = "/login";
            options.ReturnUrlParameter = "returnUrl";
            options.SlidingExpiration = true;
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = context =>
                {
                    var redirectUri = $"/login?returnUrl={Uri.EscapeDataString(context.Request.PathBase + context.Request.Path + context.Request.QueryString)}";
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
                Uri issuerBaseUri = oidcOptions.GetIssuerBaseUri();
                options.SetIssuer(new Uri(issuerBaseUri.AbsoluteUri.TrimEnd('/'), UriKind.Absolute));
                options.SetAuthorizationEndpointUris(new Uri(issuerBaseUri, "connect/authorize"));
                options.SetTokenEndpointUris(new Uri(issuerBaseUri, "connect/token"));
                options.SetEndSessionEndpointUris(new Uri(issuerBaseUri, "connect/endsession"));
                options.SetUserInfoEndpointUris(new Uri(issuerBaseUri, "connect/userinfo"));
                options.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));
                options.AllowAuthorizationCodeFlow()
                    .AllowRefreshTokenFlow();
                options.RequireProofKeyForCodeExchange();
                options.RegisterScopes(
                    OpenIddictConstants.Scopes.OpenId,
                    OpenIddictConstants.Scopes.Profile,
                    OpenIddictConstants.Scopes.Email,
                    OpenIddictConstants.Scopes.OfflineAccess,
                    OpenIddictConstants.Scopes.Roles,
                    "api");
                options.DisableAccessTokenEncryption();

                if (!string.IsNullOrWhiteSpace(oidcOptions.SigningCertificatePath)
                    && !string.IsNullOrWhiteSpace(oidcOptions.EncryptionCertificatePath))
                {
                    options.AddSigningCertificate(LoadCertificate(
                        oidcOptions.SigningCertificatePath,
                        oidcOptions.SigningCertificatePassword));
                    options.AddEncryptionCertificate(LoadCertificate(
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
                    .EnableEndSessionEndpointPassthrough()
                    .EnableTokenEndpointPassthrough()
                    .EnableUserInfoEndpointPassthrough();
            });

        return services;
    }

    private static X509Certificate2 LoadCertificate(string certificatePath, string? certificatePassword)
    {
        if (!File.Exists(certificatePath))
        {
            throw new InvalidOperationException($"OIDC certificate file '{certificatePath}' was not found.");
        }

        return X509CertificateLoader.LoadPkcs12FromFile(
            certificatePath,
            certificatePassword,
            X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.EphemeralKeySet);
    }
}
