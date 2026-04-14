using Microsoft.Extensions.Options;

namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public static class OptionsValidationServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<OidcOptions>()
            .Bind(configuration.GetRequiredSection(OidcOptions.SectionName))
            .Validate(static options => !string.IsNullOrWhiteSpace(options.Issuer), "Oidc:Issuer is required.")
            .ValidateOnStart();

        return services;
    }
}
