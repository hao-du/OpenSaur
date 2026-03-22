using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using OpenSaur.Identity.Web.Infrastructure.Persistence;

namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class SwaggerEndpointTests : IClassFixture<OpenSaurWebApplicationFactory>
{
    private readonly OpenSaurWebApplicationFactory _developmentFactory;

    public SwaggerEndpointTests(OpenSaurWebApplicationFactory developmentFactory)
    {
        _developmentFactory = developmentFactory;
    }

    [Fact]
    public async Task GetSwaggerJson_WhenDevelopment_ReturnsOpenApiDocument()
    {
        using var client = _developmentFactory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer)
            });

        var response = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var contentStream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(contentStream);

        Assert.True(document.RootElement.TryGetProperty("paths", out var paths));
        Assert.True(paths.TryGetProperty("/api/auth/login", out _));
        Assert.True(paths.TryGetProperty("/api/auth/logout", out _));
        Assert.True(paths.TryGetProperty("/api/auth/change-password", out _));
        Assert.True(paths.TryGetProperty("/api/auth/me", out _));
    }

    [Fact]
    public async Task GetSwaggerJson_WhenNotDevelopment_ReturnsNotFound()
    {
        await using var productionFactory = new ProductionSwaggerWebApplicationFactory();
        using var client = productionFactory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer)
            });

        var response = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed class ProductionSwaggerWebApplicationFactory : WebApplicationFactory<Program>
    {
        private const string CertificatePassword = "OpenSaur-Production-Test-Password1!";
        private const string IdentityDbConnectionString = "Host=localhost;Port=5432;Database=opensaur_identity_tests;Username=test;Password=test";

        private readonly SqliteConnection _connection = new("DataSource=:memory:");
        private readonly string _signingCertificatePath;
        private readonly string _encryptionCertificatePath;

        public ProductionSwaggerWebApplicationFactory()
        {
            _connection.Open();
            _signingCertificatePath = CreateCertificateFile("OpenSaur Test Signing");
            _encryptionCertificatePath = CreateCertificateFile("OpenSaur Test Encryption");
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment(Environments.Production);
            builder.UseSetting("ConnectionStrings:IdentityDb", IdentityDbConnectionString);
            builder.UseSetting("Oidc:Issuer", OpenSaurWebApplicationFactory.Issuer);
            builder.UseSetting("Oidc:SigningCertificatePath", _signingCertificatePath);
            builder.UseSetting("Oidc:SigningCertificatePassword", CertificatePassword);
            builder.UseSetting("Oidc:EncryptionCertificatePath", _encryptionCertificatePath);
            builder.UseSetting("Oidc:EncryptionCertificatePassword", CertificatePassword);
            builder.ConfigureServices(
                services =>
                {
                    services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                    services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
                    services.RemoveAll<ApplicationDbContext>();
                    services.RemoveAll<IDataProtectionProvider>();
                    services.AddSingleton(_connection);
                    services.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
                    services.AddDbContext<ApplicationDbContext>(
                        options =>
                        {
                            options.UseSqlite(_connection);
                            options.UseOpenIddict<Guid>();
                        });
                });
        }

        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);

            using var scope = host.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            dbContext.Database.EnsureCreated();

            return host;
        }

        public override async ValueTask DisposeAsync()
        {
            DisposeFiles();
            await _connection.DisposeAsync();
            await base.DisposeAsync();
        }

        protected override void Dispose(bool disposing)
        {
            DisposeFiles();
            _connection.Dispose();
            base.Dispose(disposing);
        }

        private static string CreateCertificateFile(string subjectName)
        {
            using var rsa = RSA.Create(2048);
            var request = new CertificateRequest(
                $"CN={subjectName}",
                rsa,
                HashAlgorithmName.SHA256,
                RSASignaturePadding.Pkcs1);
            using var certificate = request.CreateSelfSigned(
                DateTimeOffset.UtcNow.AddDays(-1),
                DateTimeOffset.UtcNow.AddYears(1));

            var path = Path.Combine(
                Path.GetTempPath(),
                $"{Guid.CreateVersion7():N}.pfx");

            File.WriteAllBytes(path, certificate.Export(X509ContentType.Pfx, CertificatePassword));

            return path;
        }

        private void DisposeFiles()
        {
            DeleteIfExists(_signingCertificatePath);
            DeleteIfExists(_encryptionCertificatePath);
        }

        private static void DeleteIfExists(string? path)
        {
            if (!string.IsNullOrWhiteSpace(path) && File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}
