using FluentValidation;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Identity.Web.Features.Auth;
using OpenSaur.Identity.Web.Features.Auth.Impersonation;
using OpenSaur.Identity.Web.Features.Auth.Login;
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
            .AddIdentityAndAuthorizationServices(oidcOptions)
            .AddValidationServices()
            .AddApplicationServices()
            .AddRateLimitingServices();

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
        services.AddHttpContextAccessor();
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                | ForwardedHeaders.XForwardedProto
                | ForwardedHeaders.XForwardedHost;

            // This service is expected to run behind a trusted reverse proxy.
            // Narrow KnownNetworks/KnownProxies in deployment-specific configuration if needed.
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
        services.Configure<OidcOptions>(configuration.GetRequiredSection(OidcOptions.SectionName));
        services.Configure<GoogleRecaptchaOptions>(configuration.GetSection(GoogleRecaptchaOptions.SectionName));
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
        services.AddOpenIddict()
            .AddCore(options =>
            {
                options.UseEntityFrameworkCore()
                    .UseDbContext<ApplicationDbContext>()
                    .ReplaceDefaultEntities<Guid>();
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

    private static IServiceCollection AddIdentityAndAuthorizationServices(
        this IServiceCollection services,
        OidcOptions oidcOptions)
    {
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
            options.LoginPath = "/auth-required";
            options.ReturnUrlParameter = "returnUrl";
            options.SlidingExpiration = true;
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = context =>
                {
                    if (ShouldReturnApiStatusCode(context.Request.Path, context.Request.Method))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }

                    var oidcOptions = context.HttpContext.RequestServices.GetRequiredService<IOptions<OidcOptions>>().Value;
                    context.Response.Redirect(BuildIssuerHostedLoginRedirectUri(context, oidcOptions));
                    return Task.CompletedTask;
                },
                OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
            };
        });
        services.AddScoped<IClaimsTransformation, IdentitySessionClaimsTransformation>();
        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultSignInScheme = IdentityConstants.ApplicationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.Authority = oidcOptions.Issuer;
                options.MapInboundClaims = false;
                options.RequireHttpsMetadata = !oidcOptions.Issuer.StartsWith("http://", StringComparison.OrdinalIgnoreCase);
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    NameClaimType = ApplicationClaimTypes.Name,
                    RoleClaimType = ApplicationClaimTypes.Role,
                    ValidateAudience = false
                };
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthorizationPolicies.Api,
                policy =>
                {
                    policy.AddAuthenticationSchemes(
                        IdentityConstants.ApplicationScheme,
                        JwtBearerDefaults.AuthenticationScheme);
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
        services.AddHttpClient<IGoogleRecaptchaVerifier, GoogleRecaptchaVerifier>(client =>
        {
            client.BaseAddress = new Uri("https://www.google.com/recaptcha/api/");
        });
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

    private static string BuildIssuerHostedLoginRedirectUri(
        RedirectContext<CookieAuthenticationOptions> context,
        OidcOptions oidcOptions)
    {
        var originalRedirectUri = new Uri(context.RedirectUri, UriKind.Absolute);
        var issuerHostedLoginPath = CombinePathSegments(
            oidcOptions.GetIssuerBaseUri().AbsolutePath,
            context.Options.LoginPath.Value);
        var issuerUri = oidcOptions.GetIssuerBaseUri();

        var issuerHostedLoginUri = new UriBuilder(issuerUri.Scheme, issuerUri.Host, issuerUri.IsDefaultPort ? -1 : issuerUri.Port)
        {
            Path = issuerHostedLoginPath,
            Query = originalRedirectUri.Query.TrimStart('?')
        };

        return issuerHostedLoginUri.Uri.AbsoluteUri;
    }

    private static bool ShouldReturnApiStatusCode(PathString requestPath, string requestMethod)
    {
        if (!requestPath.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return !string.Equals(requestMethod, HttpMethods.Get, StringComparison.OrdinalIgnoreCase)
               || !requestPath.StartsWithSegments("/api/auth/impersonation", StringComparison.OrdinalIgnoreCase);
    }

    private static string CombinePathSegments(string? left, string? right)
    {
        var normalizedLeft = string.IsNullOrWhiteSpace(left) || string.Equals(left, "/", StringComparison.Ordinal)
            ? string.Empty
            : left.TrimEnd('/');
        var normalizedRight = string.IsNullOrWhiteSpace(right) || string.Equals(right, "/", StringComparison.Ordinal)
            ? string.Empty
            : right.TrimStart('/');

        return (normalizedLeft, normalizedRight) switch
        {
            ("", "") => "/",
            ("", _) => $"/{normalizedRight}",
            (_, "") => normalizedLeft,
            _ => $"{normalizedLeft}/{normalizedRight}"
        };
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

    public static IEndpointRouteBuilder MapOpenSaurEndpoints(this IEndpointRouteBuilder app)
    {
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
