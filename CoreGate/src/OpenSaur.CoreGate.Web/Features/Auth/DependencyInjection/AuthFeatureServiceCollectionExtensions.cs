using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Features.Auth;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Features.Auth.DependencyInjection;

public static class AuthFeatureServiceCollectionExtensions
{
    public static IServiceCollection AddAuthFeature(this IServiceCollection services)
    {
        services.AddScoped<UserRolePermissionService>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<ChangePasswordHandler>();
        services.AddScoped<LogoutHandler>();
        services.AddScoped<AuthorizeHandler>();
        services.AddScoped<TokenHandler>();
        services.AddScoped<UserInfoHandler>();
        return services;
    }
}
