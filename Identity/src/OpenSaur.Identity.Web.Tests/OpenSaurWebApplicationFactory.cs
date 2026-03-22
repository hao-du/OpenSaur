using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Persistence;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests;

public sealed class OpenSaurWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "https://identity.test.opensaur";
    private const string IdentityDbConnectionString = "Host=localhost;Port=5432;Database=opensaur_identity_tests;Username=test;Password=test";
    private const string FirstPartyAudience = "opensaur.firstparty";
    private const string FirstPartySigningKey = "test-signing-key-for-opensaur-identity-phase1-123456";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly SemaphoreSlim _databaseInitializationLock = new(1, 1);
    private bool _databaseInitialized;

    public OpenSaurWebApplicationFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);
        builder.UseSetting("ConnectionStrings:IdentityDb", IdentityDbConnectionString);
        builder.UseSetting("Oidc:Issuer", Issuer);
        builder.UseSetting("FirstPartyAuth:Audience", FirstPartyAudience);
        builder.UseSetting("FirstPartyAuth:SigningKey", FirstPartySigningKey);
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
        EnsureDatabaseCreatedAsync(host.Services).GetAwaiter().GetResult();
        return host;
    }

    public async Task SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles,
        bool isActive = true,
        bool workspaceIsActive = true)
    {
        await EnsureDatabaseCreatedAsync();

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var workspace = await dbContext.Workspaces.SingleAsync();
        workspace.IsActive = workspaceIsActive;
        await dbContext.SaveChangesAsync();

        var existingUser = await userManager.FindByNameAsync(userName);
        if (existingUser is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.CreateVersion7(),
            UserName = userName,
            Email = TestFakers.CreateEmail(userName),
            RequirePasswordChange = false,
            WorkspaceId = workspace.Id,
            IsActive = isActive,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(static error => error.Description));
            throw new InvalidOperationException($"Failed to seed test user '{userName}': {errors}");
        }

        if (roles.Any())
        {
            var addRolesResult = await userManager.AddToRolesAsync(user, roles);
            if (!addRolesResult.Succeeded)
            {
                var errors = string.Join(", ", addRolesResult.Errors.Select(static error => error.Description));
                throw new InvalidOperationException($"Failed to assign roles to '{userName}': {errors}");
            }
        }
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
            _databaseInitialized = true;
        }
        finally
        {
            _databaseInitializationLock.Release();
        }
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
}
