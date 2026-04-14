namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class AuthServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateAuthServices(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        return services;
    }
}
