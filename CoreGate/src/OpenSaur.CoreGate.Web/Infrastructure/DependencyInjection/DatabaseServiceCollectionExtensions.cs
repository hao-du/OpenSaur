using Microsoft.EntityFrameworkCore;
using OpenSaur.CoreGate.Web.Features.Auth;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;

public static class DatabaseServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("IdentityDb")
            ?? throw new InvalidOperationException("Connection string 'IdentityDb' is required.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
            options.UseOpenIddict<Guid>();
        });

        return services;
    }
}
