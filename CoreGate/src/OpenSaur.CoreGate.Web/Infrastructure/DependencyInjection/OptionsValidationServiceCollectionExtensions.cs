using Microsoft.Extensions.Options;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;

namespace OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;

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
