using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenSaur.Identity.Web.Infrastructure;

namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class DependencyInjectionTests
{
    [Fact]
    public void AddOpenSaurInfrastructure_WhenProductionKeyMaterialIsMissing_Throws()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration();
        var environment = new TestHostEnvironment(Environments.Production);

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddOpenSaurInfrastructure(configuration, environment));

        Assert.Contains("OIDC durable signing and encryption certificates are required", exception.Message);
    }

    [Fact]
    public void AddOpenSaurInfrastructure_WhenTestingEnvironmentIsUsed_AllowsEphemeralKeys()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration();
        var environment = new TestHostEnvironment(Environments.Development);

        services.AddOpenSaurInfrastructure(configuration, environment);
    }

    [Fact]
    public void AddOpenSaurInfrastructure_WhenTestingEnvironmentIsUsed_RequiresDurableKeys()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration();
        var environment = new TestHostEnvironment("Testing");

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddOpenSaurInfrastructure(configuration, environment));

        Assert.Contains("OIDC durable signing and encryption certificates are required", exception.Message);
    }

    [Fact]
    public void AddOpenSaurInfrastructure_WhenRedisConnectionStringIsConfigured_RegistersDistributedRedisCache()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:Redis"] = "localhost:6379"
            });
        var environment = new TestHostEnvironment(Environments.Development);

        services.AddOpenSaurInfrastructure(configuration, environment);

        using var serviceProvider = services.BuildServiceProvider();
        var distributedCache = serviceProvider.GetRequiredService<IDistributedCache>();

        Assert.Contains(
            "StackExchangeRedis",
            distributedCache.GetType().FullName,
            StringComparison.Ordinal);
    }

    private static IConfiguration CreateConfiguration(Dictionary<string, string?>? overrides = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:IdentityDb"] = "Host=localhost;Port=5432;Database=opensaur_identity_tests;Username=test;Password=test",
            ["Oidc:Issuer"] = "https://identity.test.opensaur"
        };

        if (overrides is not null)
        {
            foreach (var (key, value) in overrides)
            {
                settings[key] = value;
            }
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public TestHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }

        public string ApplicationName { get; set; } = "OpenSaur.Identity.Web";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; }
            = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(AppContext.BaseDirectory);
    }
}
