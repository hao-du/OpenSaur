using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using System.Text.Json;
using OpenIddict.Abstractions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Oidc;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests;

public sealed class OpenSaurWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "https://identity.test.opensaur";
    private const string IdentityDbConnectionString = "Host=localhost;Port=5432;Database=opensaur_identity_tests;Username=test;Password=test";

    private readonly IReadOnlyDictionary<string, string?> _settings;
    private readonly Action<IWebHostBuilder>? _configureWebHost;
    private readonly Action<DbContextOptionsBuilder>? _configureDbContext;
    private readonly bool _useTestFirstPartyOidcTokenClient;
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly SemaphoreSlim _databaseInitializationLock = new(1, 1);
    private bool _databaseInitialized;

    public OpenSaurWebApplicationFactory()
        : this(null, null, null, true)
    {
    }

    internal OpenSaurWebApplicationFactory(
        IReadOnlyDictionary<string, string?>? settings = null,
        Action<IWebHostBuilder>? configureWebHost = null,
        Action<DbContextOptionsBuilder>? configureDbContext = null,
        bool useTestFirstPartyOidcTokenClient = true)
    {
        _settings = settings ?? new Dictionary<string, string?>();
        _configureWebHost = configureWebHost;
        _configureDbContext = configureDbContext;
        _useTestFirstPartyOidcTokenClient = useTestFirstPartyOidcTokenClient;
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);
        builder.UseSetting("ConnectionStrings:IdentityDb", IdentityDbConnectionString);
        builder.UseSetting("Oidc:Issuer", Issuer);
        builder.UseSetting("Oidc:FirstPartyWeb:ClientId", FirstPartyApiTestClient.ClientId);
        builder.UseSetting("Oidc:FirstPartyWeb:ClientSecret", FirstPartyApiTestClient.ClientSecret);
        builder.UseSetting("Oidc:FirstPartyWeb:RedirectUri", FirstPartyApiTestClient.RedirectUri);
        builder.UseSetting("EndpointResilience:RateLimiting:Default:PermitLimit", "1000");
        builder.UseSetting("EndpointResilience:RateLimiting:Auth:PermitLimit", "1000");
        builder.UseSetting("EndpointResilience:RateLimiting:Token:PermitLimit", "1000");
        foreach (var setting in _settings)
        {
            if (!string.IsNullOrWhiteSpace(setting.Value))
            {
                builder.UseSetting(setting.Key, setting.Value);
            }
        }

        builder.ConfigureServices(
            services =>
            {
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
                services.RemoveAll<ApplicationDbContext>();
                services.RemoveAll<IDataProtectionProvider>();
                services.AddSingleton(_connection);
                services.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
                if (_useTestFirstPartyOidcTokenClient)
                {
                    services.RemoveAll<IFirstPartyOidcTokenClient>();
                    services.AddScoped<IFirstPartyOidcTokenClient>(
                        _ => new TestServerFirstPartyOidcTokenClient(this));
                }
                services.AddDbContext<ApplicationDbContext>(
                    options =>
                    {
                        options.UseSqlite(_connection);
                        options.UseOpenIddict<Guid>();
                        _configureDbContext?.Invoke(options);
                    });
            });
        _configureWebHost?.Invoke(builder);
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        EnsureDatabaseCreatedAsync(host.Services).GetAwaiter().GetResult();
        return host;
    }

    public async Task ResetDatabaseAsync()
    {
        var services = Services;

        await _databaseInitializationLock.WaitAsync();
        try
        {
            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.EnsureDeletedAsync();
            await dbContext.Database.EnsureCreatedAsync();
            await EnsureConfiguredFirstPartyOidcClientAsync(scope.ServiceProvider);
            _databaseInitialized = true;
        }
        finally
        {
            _databaseInitializationLock.Release();
        }
    }

    public async Task SeedOidcClientAsync(
        string clientId,
        string redirectUri,
        string? clientSecret = null,
        string? postLogoutRedirectUri = null)
    {
        await EnsureDatabaseCreatedAsync();

        using var scope = Services.CreateScope();
        var manager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
        if (await manager.FindByClientIdAsync(clientId) is not null)
        {
            return;
        }

        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = clientId,
            ClientSecret = clientSecret,
            ClientType = string.IsNullOrWhiteSpace(clientSecret)
                ? OpenIddictConstants.ClientTypes.Public
                : OpenIddictConstants.ClientTypes.Confidential,
            ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
            DisplayName = clientId
        };

        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Profile);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Email);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Scopes.Roles);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + "api");
        descriptor.RedirectUris.Add(new Uri(redirectUri));

        if (!string.IsNullOrWhiteSpace(postLogoutRedirectUri))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri));
        }

        await manager.CreateAsync(descriptor);
    }

    private async Task EnsureDatabaseCreatedAsync()
    {
        await EnsureDatabaseCreatedAsync(Services);
    }

    private async Task EnsureDatabaseCreatedAsync(IServiceProvider services)
    {
        if (_databaseInitialized)
        {
            return;
        }

        await _databaseInitializationLock.WaitAsync();
        try
        {
            if (_databaseInitialized)
            {
                return;
            }

            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.EnsureCreatedAsync();
            await EnsureConfiguredFirstPartyOidcClientAsync(scope.ServiceProvider);
            _databaseInitialized = true;
        }
        finally
        {
            _databaseInitializationLock.Release();
        }
    }

    protected override void Dispose(bool disposing)
    {
        _databaseInitializationLock.Dispose();
        _connection.Dispose();

        base.Dispose(disposing);
    }

    private static async Task EnsureConfiguredFirstPartyOidcClientAsync(IServiceProvider services)
    {
        var registrar = services.GetRequiredService<FirstPartyOidcClientRegistrar>();
        await registrar.EnsureConfiguredClientAsync();
    }

    private sealed class TestServerFirstPartyOidcTokenClient : IFirstPartyOidcTokenClient
    {
        private readonly OpenSaurWebApplicationFactory _factory;

        public TestServerFirstPartyOidcTokenClient(OpenSaurWebApplicationFactory factory)
        {
            _factory = factory;
        }

        public async Task<FirstPartyOidcTokenResult?> ExchangeAuthorizationCodeAsync(
            string code,
            CancellationToken cancellationToken)
        {
            using var client = FirstPartyApiTestClient.CreateClient(_factory);
            using var response = await client.PostAsync(
                "/connect/token",
                new FormUrlEncodedContent(
                [
                    new KeyValuePair<string, string>("grant_type", "authorization_code"),
                    new KeyValuePair<string, string>("client_id", FirstPartyApiTestClient.ClientId),
                    new KeyValuePair<string, string>("client_secret", FirstPartyApiTestClient.ClientSecret),
                    new KeyValuePair<string, string>("redirect_uri", FirstPartyApiTestClient.RedirectUri),
                    new KeyValuePair<string, string>("code", code)
                ]),
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            await using var payloadStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var payload = await JsonDocument.ParseAsync(payloadStream, cancellationToken: cancellationToken);

            var accessToken = payload.RootElement.GetProperty("access_token").GetString();
            var refreshToken = payload.RootElement.GetProperty("refresh_token").GetString();
            if (string.IsNullOrWhiteSpace(accessToken) || string.IsNullOrWhiteSpace(refreshToken))
            {
                return null;
            }

            var expiresInSeconds = payload.RootElement.TryGetProperty("expires_in", out var expiresInElement)
                && expiresInElement.TryGetInt32(out var expiresIn)
                    ? expiresIn
                    : 3600;

            return new FirstPartyOidcTokenResult(
                accessToken,
                refreshToken,
                DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds));
        }

        public async Task<FirstPartyOidcTokenResult?> RefreshAccessTokenAsync(
            string refreshToken,
            CancellationToken cancellationToken)
        {
            using var client = FirstPartyApiTestClient.CreateClient(_factory);
            using var response = await client.PostAsync(
                "/connect/token",
                new FormUrlEncodedContent(
                [
                    new KeyValuePair<string, string>("grant_type", "refresh_token"),
                    new KeyValuePair<string, string>("client_id", FirstPartyApiTestClient.ClientId),
                    new KeyValuePair<string, string>("client_secret", FirstPartyApiTestClient.ClientSecret),
                    new KeyValuePair<string, string>("refresh_token", refreshToken)
                ]),
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            await using var payloadStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var payload = await JsonDocument.ParseAsync(payloadStream, cancellationToken: cancellationToken);

            var accessToken = payload.RootElement.GetProperty("access_token").GetString();
            var rotatedRefreshToken = payload.RootElement.GetProperty("refresh_token").GetString();
            if (string.IsNullOrWhiteSpace(accessToken) || string.IsNullOrWhiteSpace(rotatedRefreshToken))
            {
                return null;
            }

            var expiresInSeconds = payload.RootElement.TryGetProperty("expires_in", out var expiresInElement)
                && expiresInElement.TryGetInt32(out var expiresIn)
                    ? expiresIn
                    : 3600;

            return new FirstPartyOidcTokenResult(
                accessToken,
                rotatedRefreshToken,
                DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds));
        }
    }
}
