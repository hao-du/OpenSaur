using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
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
    public void AddOpenSaurInfrastructure_WhenProductionFallbackFlagIsEnabled_AllowsEphemeralKeys()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration(
            new Dictionary<string, string?>
            {
                ["Oidc:AllowEphemeralKeysInProduction"] = "true"
            });
        var environment = new TestHostEnvironment(Environments.Production);

        services.AddOpenSaurInfrastructure(configuration, environment);
    }

    [Fact]
    public void AddOpenSaurInfrastructure_WhenOnlyOneProductionCertificatePathIsConfigured_Throws()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration(
            new Dictionary<string, string?>
            {
                ["Oidc:AllowEphemeralKeysInProduction"] = "true",
                ["Oidc:SigningCertificatePath"] = "signing-only.pfx"
            });
        var environment = new TestHostEnvironment(Environments.Production);

        var exception = Assert.Throws<InvalidOperationException>(
            () => services.AddOpenSaurInfrastructure(configuration, environment));

        Assert.Contains("Both OIDC signing and encryption certificate paths must be configured together", exception.Message);
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

    [Fact]
    public void AddOpenSaurInfrastructure_UsesRequestScopedAuthCookies()
    {
        var services = new ServiceCollection();
        var configuration = CreateConfiguration();
        var environment = new TestHostEnvironment(Environments.Development);

        services.AddOpenSaurInfrastructure(configuration, environment);

        using var serviceProvider = services.BuildServiceProvider();
        var options = serviceProvider
            .GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(IdentityConstants.ApplicationScheme);

        Assert.Equal(CookieSecurePolicy.SameAsRequest, options.Cookie.SecurePolicy);
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
