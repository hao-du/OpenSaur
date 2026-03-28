using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Security;

public sealed class CurrentUserContextTests
{
    [Fact]
    public void Create_WhenRoleClaimUsesLegacySuperAdministratorValue_ReturnsSuperAdministratorContext()
    {
        var principal = CreatePrincipal(SystemRoles.SuperAdministrator, Guid.CreateVersion7());

        var context = CurrentUserContext.Create(principal);

        Assert.NotNull(context);
        Assert.True(context!.IsSuperAdministrator);
        Assert.True(context.HasGlobalWorkspaceScope);
    }

    [Fact]
    public void Create_WhenRoleClaimUsesSpacedNormalizedSuperAdministratorValue_ReturnsSuperAdministratorContext()
    {
        var principal = CreatePrincipal("SUPER ADMINISTRATOR", Guid.CreateVersion7());

        var context = CurrentUserContext.Create(principal);

        Assert.NotNull(context);
        Assert.True(context!.IsSuperAdministrator);
        Assert.True(context.HasGlobalWorkspaceScope);
    }

    [Fact]
    public async Task Handle_WhenRoleClaimUsesLegacySuperAdministratorValue_ReturnsAllWorkspaces()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlite(connection);
        optionsBuilder.UseOpenIddict<Guid>();
        var options = optionsBuilder.Options;

        await using (var setupContext = new ApplicationDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        await using var dbContext = new ApplicationDbContext(options);
        var workspaceId = await dbContext.Workspaces
            .Select(workspace => workspace.Id)
            .SingleAsync();
        var principal = CreatePrincipal(SystemRoles.SuperAdministrator, workspaceId);
        var permissionAuthorizationService = new PermissionAuthorizationService(dbContext);
        var userAuthorizationService = new UserAuthorizationService(dbContext, permissionAuthorizationService);

        var result = await GetCurrentUserHandler.Handle(
            principal,
            dbContext,
            userAuthorizationService,
            CancellationToken.None);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection()
                .AddLogging()
                .AddOptions()
                .BuildServiceProvider(),
            Response =
            {
                Body = new MemoryStream()
            }
        };

        await result.ExecuteAsync(httpContext);
        httpContext.Response.Body.Position = 0;
        using var payload = await JsonDocument.ParseAsync(httpContext.Response.Body);
        var workspaceName = payload.RootElement
            .GetProperty("data")
            .GetProperty("workspaceName")
            .GetString();

        Assert.Equal("All workspaces", workspaceName);
    }

    [Fact]
    public async Task Handle_WhenRoleClaimUsesSpacedNormalizedSuperAdministratorValue_ReturnsAllWorkspaces()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlite(connection);
        optionsBuilder.UseOpenIddict<Guid>();
        var options = optionsBuilder.Options;

        await using (var setupContext = new ApplicationDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        await using var dbContext = new ApplicationDbContext(options);
        var workspaceId = await dbContext.Workspaces
            .Select(workspace => workspace.Id)
            .SingleAsync();
        var principal = CreatePrincipal("SUPER ADMINISTRATOR", workspaceId);
        var permissionAuthorizationService = new PermissionAuthorizationService(dbContext);
        var userAuthorizationService = new UserAuthorizationService(dbContext, permissionAuthorizationService);

        var result = await GetCurrentUserHandler.Handle(
            principal,
            dbContext,
            userAuthorizationService,
            CancellationToken.None);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = new ServiceCollection()
                .AddLogging()
                .AddOptions()
                .BuildServiceProvider(),
            Response =
            {
                Body = new MemoryStream()
            }
        };

        await result.ExecuteAsync(httpContext);
        httpContext.Response.Body.Position = 0;
        using var payload = await JsonDocument.ParseAsync(httpContext.Response.Body);
        var workspaceName = payload.RootElement
            .GetProperty("data")
            .GetProperty("workspaceName")
            .GetString();

        Assert.Equal("All workspaces", workspaceName);
    }

    private static ClaimsPrincipal CreatePrincipal(string roleValue, Guid workspaceId)
    {
        var identity = new ClaimsIdentity("test");
        identity.AddClaim(new Claim(ApplicationClaimTypes.Subject, Guid.CreateVersion7().ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.Name, "SystemAdministrator"));
        identity.AddClaim(new Claim(ApplicationClaimTypes.WorkspaceId, workspaceId.ToString()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.RequirePasswordChange, bool.FalseString.ToLowerInvariant()));
        identity.AddClaim(new Claim(ApplicationClaimTypes.Role, roleValue));

        return new ClaimsPrincipal(identity);
    }
}
