using FluentValidation;
using System.Security.Cryptography.X509Certificates;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using OpenIddict.Validation.AspNetCore;
using OpenSaur.Identity.Web.Features.Auth;
using OpenSaur.Identity.Web.Features.Auth.Login;
using OpenSaur.Identity.Web.Features.Auth.Oidc;
using OpenSaur.Identity.Web.Features.PermissionScopes;
using OpenSaur.Identity.Web.Features.Permissions;
using OpenSaur.Identity.Web.Features.Roles;
using OpenSaur.Identity.Web.Features.UserRoles;
using OpenSaur.Identity.Web.Features.Users;
using OpenSaur.Identity.Web.Features.Users.Outbox;
using OpenSaur.Identity.Web.Features.Workspaces;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Handlers;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.WorkspaceRoles;
using OpenSaur.Identity.Web.Infrastructure.Http.Configuration;
using OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddOpenSaurInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var connectionString = GetRequiredIdentityConnectionString(configuration);
        var redisConnectionString = configuration.GetConnectionString("Redis");
        var oidcOptions = GetRequiredOidcOptions(configuration);
        var endpointResilienceOptions = BindEndpointResilienceOptions(configuration);

        services.AddDeveloperExperienceServices()
            .AddCacheAndHostServices(configuration, redisConnectionString, endpointResilienceOptions)
            .AddPersistenceServices(connectionString)
            .AddIdentityAndAuthorizationServices()
            .AddValidationServices()
            .AddApplicationServices()
            .AddRateLimitingServices();

        services.AddOpenIddictServices(oidcOptions, environment);

        return services;
    }

    private static string GetRequiredIdentityConnectionString(IConfiguration configuration)
    {
        return configuration.GetConnectionString("IdentityDb")
            ?? throw new InvalidOperationException("Connection string 'IdentityDb' is required.");
    }

    private static OidcOptions GetRequiredOidcOptions(IConfiguration configuration)
    {
        return configuration.GetRequiredSection(OidcOptions.SectionName).Get<OidcOptions>()
            ?? throw new InvalidOperationException("OIDC configuration is required.");
    }

    private static EndpointResilienceOptions BindEndpointResilienceOptions(IConfiguration configuration)
    {
        var endpointResilienceOptions = new EndpointResilienceOptions();
        configuration.GetSection(EndpointResilienceOptions.SectionName).Bind(endpointResilienceOptions);
        return endpointResilienceOptions;
    }

    private static IServiceCollection AddDeveloperExperienceServices(this IServiceCollection services)
    {
        services.AddProblemDetails();
        services.AddExceptionHandler<ApiExceptionHandler>();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc(
                "v1",
                new OpenApiInfo
                {
                    Title = "OpenSaur Identity API",
                    Version = "v1"
                });

            options.AddSecurityDefinition(
                "Bearer",
                new OpenApiSecurityScheme
                {
                    BearerFormat = "JWT",
                    Description = "Provide the JWT access token for protected API endpoints.",
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Scheme = "bearer",
                    Type = SecuritySchemeType.Http
                });

            options.AddSecurityRequirement(
                new OpenApiSecurityRequirement
                {
                    [
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Id = "Bearer",
                                Type = ReferenceType.SecurityScheme
                            }
                        }
                    ] = []
                });
        });

        return services;
    }

    private static IServiceCollection AddCacheAndHostServices(
        this IServiceCollection services,
        IConfiguration configuration,
        string? redisConnectionString,
        EndpointResilienceOptions endpointResilienceOptions)
    {
        services.AddDataProtection();

        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options => options.Configuration = redisConnectionString);
        }

        services.AddHybridCache();
        services.AddHttpsRedirection(options => options.HttpsPort = 443);
        services.AddHttpContextAccessor();
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            // This service is expected to run behind a trusted reverse proxy.
            // Narrow KnownNetworks/KnownProxies in deployment-specific configuration if needed.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
        services.Configure<OidcOptions>(configuration.GetRequiredSection(OidcOptions.SectionName));
        services.Configure<EndpointResilienceOptions>(configuration.GetSection(EndpointResilienceOptions.SectionName));
        services.AddSingleton(endpointResilienceOptions);

        return services;
    }

    private static IServiceCollection AddPersistenceServices(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
            options.UseOpenIddict<Guid>();
        });
        services.AddScoped<UserRepository>();
        services.AddScoped<RoleRepository>();
        services.AddScoped<PermissionRepository>();
        services.AddScoped<PermissionScopeRepository>();
        services.AddScoped<UserRoleRepository>();
        services.AddScoped<WorkspaceRepository>();
        services.AddScoped<WorkspaceRoleRepository>();

        return services;
    }

    private static IServiceCollection AddIdentityAndAuthorizationServices(this IServiceCollection services)
    {
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
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
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.LoginPath = "/login";
            options.ReturnUrlParameter = "returnUrl";
            options.SlidingExpiration = true;
        });
        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthorizationPolicies.Api,
                policy =>
                {
                    policy.AddAuthenticationSchemes(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                });
        });

        return services;
    }

    private static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
        services.AddScoped<OutboxMessageWriter>();
        services.AddScoped<UserOutboxWriter>();
        services.AddScoped<PermissionAuthorizationService>();
        services.AddScoped<UserAuthorizationService>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddScoped<FirstPartyOidcClientRegistrar>();
        services.AddScoped<IFirstPartyOidcTokenClient, FirstPartyOidcTokenClient>();
        services.AddSingleton<IdempotencyCacheStore>();
        services.AddSingleton<IdempotencyRequestLockProvider>();
        services.AddSingleton<EndpointResilienceContextResolver>();
        services.AddSingleton<EndpointResiliencePolicyResolver>();

        return services;
    }

    private static IServiceCollection AddValidationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>(ServiceLifetime.Transient);
        return services;
    }

    private static IServiceCollection AddRateLimitingServices(this IServiceCollection services)
    {
        services.AddRateLimiter(
            options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                    httpContext =>
                    {
                        var contextResolver = httpContext.RequestServices.GetRequiredService<EndpointResilienceContextResolver>();
                        var policyResolver = httpContext.RequestServices.GetRequiredService<EndpointResiliencePolicyResolver>();
                        var resilienceContext = contextResolver.Resolve(httpContext);
                        var policy = policyResolver.GetRateLimitingPolicy(resilienceContext.PolicyScope);

                        return RateLimitPartition.GetFixedWindowLimiter(
                            $"{resilienceContext.PolicyScope}:{resilienceContext.CallerScopeKey}",
                            _ => new FixedWindowRateLimiterOptions
                            {
                                AutoReplenishment = true,
                                PermitLimit = policy.PermitLimit,
                                QueueLimit = policy.QueueLimit,
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                Window = TimeSpan.FromSeconds(policy.WindowSeconds)
                            });
                    });
            });

        return services;
    }

    private static IServiceCollection AddOpenIddictServices(
        this IServiceCollection services,
        OidcOptions oidcOptions,
        IHostEnvironment environment)
    {
        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                    .UseDbContext<ApplicationDbContext>()
                    .ReplaceDefaultEntities<Guid>();
            })
            .AddServer(options =>
            {
                options.SetIssuer(new Uri(oidcOptions.Issuer));
                options.SetAuthorizationEndpointUris("connect/authorize")
                    .SetTokenEndpointUris("connect/token")
                    .SetEndSessionEndpointUris("connect/logout");
                options.AllowAuthorizationCodeFlow()
                    .AllowRefreshTokenFlow();
                options.RegisterScopes(
                    OpenIddictConstants.Scopes.OpenId,
                    OpenIddictConstants.Scopes.Profile,
                    OpenIddictConstants.Scopes.Email,
                    OpenIddictConstants.Scopes.OfflineAccess,
                    OpenIddictConstants.Scopes.Roles,
                    "api");
                options.SetAccessTokenLifetime(TimeSpan.FromHours(1));
                options.SetRefreshTokenLifetime(TimeSpan.FromDays(14));
                options.SetRefreshTokenReuseLeeway(TimeSpan.Zero);

                // Access tokens are validated as plain JWTs by resource servers using
                // shared signing material. Token encryption is not part of the current model.
                options.DisableAccessTokenEncryption();
                ConfigureOidcKeyMaterial(options, oidcOptions, environment);
                options.AddEventHandler<OpenIddictServerEvents.ApplyTokenResponseContext>(builder =>
                    builder.UseScopedHandler<InternalFirstPartyTokenResponseHandler>()
                        .SetOrder(int.MaxValue)
                        .SetType(OpenIddictServerHandlerType.Custom));
                options.UseAspNetCore()
                    .EnableAuthorizationEndpointPassthrough()
                    .EnableEndSessionEndpointPassthrough();
            })
            .AddValidation(options =>
            {
                options.UseLocalServer();
                options.UseAspNetCore();
                options.EnableTokenEntryValidation();
            });

        return services;
    }

    private static void ConfigureOidcKeyMaterial(
        Microsoft.Extensions.DependencyInjection.OpenIddictServerBuilder builder,
        OidcOptions oidcOptions,
        IHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            builder.AddEphemeralEncryptionKey()
                .AddEphemeralSigningKey();

            return;
        }

        if (string.IsNullOrWhiteSpace(oidcOptions.SigningCertificatePath)
            || string.IsNullOrWhiteSpace(oidcOptions.EncryptionCertificatePath))
        {
            throw new InvalidOperationException(
                "OIDC durable signing and encryption certificates are required outside the Development environment.");
        }

        var signingCertificate = LoadCertificate(
            oidcOptions.SigningCertificatePath,
            oidcOptions.SigningCertificatePassword);
        var encryptionCertificate = LoadCertificate(
            oidcOptions.EncryptionCertificatePath,
            oidcOptions.EncryptionCertificatePassword);

        builder.AddSigningCertificate(signingCertificate)
            .AddEncryptionCertificate(encryptionCertificate);
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

    public static IEndpointRouteBuilder MapOpenSaurEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapOidcEndpoints();
        app.MapAuthEndpoints();
        app.MapUserEndpoints();
        app.MapUserRoleEndpoints();
        app.MapWorkspaceEndpoints();
        app.MapRoleEndpoints();
        app.MapPermissionEndpoints();
        app.MapPermissionScopeEndpoints();

        return app;
    }
}
