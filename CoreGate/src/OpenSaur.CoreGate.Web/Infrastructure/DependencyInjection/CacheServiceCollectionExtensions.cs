using Microsoft.Extensions.Caching.Hybrid;
using OpenSaur.CoreGate.Web.Infrastructure.Caching;

namespace OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;

public static class CacheServiceCollectionExtensions
{
    public static IServiceCollection AddCoreGateCaching(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis");

        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = "CoreGate:";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.AddHybridCache(options =>
        {
            // Default expiration policy: L1 memory is kept short (30s) to avoid multi-node staleness,
            // while L2 distributed cache (Redis) retains entries for 10 minutes.
            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(10),
                LocalCacheExpiration = TimeSpan.FromSeconds(30)
            };
            options.MaximumKeyLength = 512;
            options.MaximumPayloadBytes = 1024 * 1024; // 1 MB
        });

        services.AddSingleton<ICacheService, CacheService>();

        return services;
    }
}

