using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Features.Auth.DependencyInjection;

public static class AuthFeatureServiceCollectionExtensions
{
    public static IServiceCollection AddAuthFeature(this IServiceCollection services)
    {
        services.AddScoped<LoginHandler>();
        services.AddScoped<ExchangeTokenHandler>();
        services.AddScoped<RefreshTokenHandler>();
        services.AddScoped<ChangePasswordAccessHandler>();
        services.AddScoped<ChangePasswordHandler>();
        services.AddScoped<AuthorizeHandler>();
        services.AddScoped<EndSessionHandler>();
        services.AddScoped<TokenHandler>();
        services.AddScoped<UserInfoHandler>();

        services.AddScoped<UserRolePermissionService>();
        services.AddScoped<CookieService>();
        services.AddScoped<TokenService>();
        return services;
    }
}
