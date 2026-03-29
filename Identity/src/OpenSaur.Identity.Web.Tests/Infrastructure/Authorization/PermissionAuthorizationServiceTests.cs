using System.Security.Claims;
using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Authorization;

public sealed class PermissionAuthorizationServiceTests
{
    [Fact]
    public async Task HasPermissionAsync_WhenAdministratorInSameWorkspaceAndDefaultPermissionAssigned_ReturnsTrue()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionsAsync_WhenMixedPermissionCodesRequested_ReturnsGrantMap()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var permissions = await service.HasPermissionsAsync(
            user.Id,
            [(int)PermissionCode.Administrator_CanManage, 999]);

        Assert.True(permissions[(int)PermissionCode.Administrator_CanManage]);
        Assert.False(permissions[999]);
    }

    [Fact]
    public async Task HasPermissionsAsync_WhenTypedPermissionCodesRequested_ReturnsTypedGrantMap()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var permissions = await service.HasPermissionsAsync(
            user.Id,
            [PermissionCode.Administrator_CanManage]);

        Assert.True(permissions[PermissionCode.Administrator_CanManage]);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenTypedPermissionCodeRequested_ReturnsGrantResult()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenAdministratorCanManageAssigned_AlsoGrantsAdministratorCanView()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanView);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenOnlyAdministratorCanViewAssigned_DoesNotGrantAdministratorCanManage()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var permission = await dbContext.Permissions.SingleAsync(
            record => record.CodeId == (int)PermissionCode.Administrator_CanView);
        var roleName = TestFakers.CreateRoleName();
        var viewOnlyRole = new ApplicationRole
        {
            Id = Guid.CreateVersion7(),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant(),
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.Roles.Add(viewOnlyRole);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = viewOnlyRole.Id
        });
        dbContext.RolePermissions.Add(new RolePermission
        {
            RoleId = viewOnlyRole.Id,
            PermissionId = permission.Id
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanManage);

        Assert.False(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenAdministratorPermissionAssignmentIsInactive_ReturnsFalse()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);
        var administratorRoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = administratorRoleId
        });
        await dbContext.SaveChangesAsync();

        var administratorPermissionAssignment = await dbContext.RolePermissions.SingleAsync(
            rolePermission => rolePermission.RoleId == administratorRoleId);
        administratorPermissionAssignment.IsActive = false;
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.False(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenImpliedPermissionIsInactive_DoesNotGrantInactivePermission()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);
        var administratorRoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = administratorRoleId
        });
        await dbContext.SaveChangesAsync();

        var administratorCanView = await dbContext.Permissions.SingleAsync(
            permission => permission.CodeId == (int)PermissionCode.Administrator_CanView);
        administratorCanView.IsActive = false;
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanView);

        Assert.False(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenPermissionScopeChangesInDatabase_UsesDatabaseScopeForImplication()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);
        var administratorRoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator);
        var newScope = new PermissionScope
        {
            Id = Guid.CreateVersion7(),
            Name = "Custom",
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };

        dbContext.PermissionScopes.Add(newScope);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = administratorRoleId
        });
        await dbContext.SaveChangesAsync();

        var administratorCanManage = await dbContext.Permissions.SingleAsync(
            permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage);
        administratorCanManage.PermissionScopeId = newScope.Id;
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var canManage = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanManage);
        var canView = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanView);

        Assert.True(canManage);
        Assert.False(canView);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenPermissionRanksChangeInDatabase_UsesDatabaseRankForImplication()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);
        var administratorRoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = administratorRoleId
        });
        await dbContext.SaveChangesAsync();

        var administratorCanManage = await dbContext.Permissions.SingleAsync(
            permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage);
        var administratorCanView = await dbContext.Permissions.SingleAsync(
            permission => permission.CodeId == (int)PermissionCode.Administrator_CanView);

        administratorCanManage.Rank = 1;
        administratorCanView.Rank = 2;
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var canManage = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanManage);
        var canView = await service.HasPermissionAsync(
            user.Id,
            PermissionCode.Administrator_CanView);

        Assert.True(canManage);
        Assert.False(canView);
    }

    [Fact]
    public async Task CanManageWorkspaceAsync_WhenAdministratorTargetsDifferentWorkspace_ReturnsFalse()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var otherWorkspace = new Workspace
        {
            Id = Guid.CreateVersion7(),
            Name = TestFakers.CreateWorkspaceName(),
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.Workspaces.Add(otherWorkspace);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.CanManageWorkspaceAsync(
            CreatePrincipal(user, workspace.Id, [StandardRoleNames.Administrator]),
            otherWorkspace.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.False(isAuthorized);
    }

    [Fact]
    public async Task CanManageWorkspaceAsync_WhenRoleHasAdministratorPermissionInSameWorkspace_ReturnsTrue()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var permission = await dbContext.Permissions.SingleAsync(
            record => record.CodeId == (int)PermissionCode.Administrator_CanManage);
        var roleName = TestFakers.CreateRoleName();
        var customRole = new ApplicationRole
        {
            Id = Guid.CreateVersion7(),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant(),
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.Roles.Add(customRole);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = customRole.Id
        });
        dbContext.WorkspaceRoles.Add(new WorkspaceRole
        {
            WorkspaceId = workspace.Id,
            RoleId = customRole.Id,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        });
        dbContext.RolePermissions.Add(new RolePermission
        {
            RoleId = customRole.Id,
            PermissionId = permission.Id
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.CanManageWorkspaceAsync(
            CreatePrincipal(user, workspace.Id, [customRole.Name]),
            workspace.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task CanManageWorkspaceAsync_WhenTypedPermissionCodeIsUsed_ReturnsTrue()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var permission = await dbContext.Permissions.SingleAsync(
            record => record.CodeId == (int)PermissionCode.Administrator_CanManage);
        var roleName = TestFakers.CreateRoleName();
        var customRole = new ApplicationRole
        {
            Id = Guid.CreateVersion7(),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant(),
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.Roles.Add(customRole);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = customRole.Id
        });
        dbContext.WorkspaceRoles.Add(new WorkspaceRole
        {
            WorkspaceId = workspace.Id,
            RoleId = customRole.Id,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        });
        dbContext.RolePermissions.Add(new RolePermission
        {
            RoleId = customRole.Id,
            PermissionId = permission.Id
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.CanManageWorkspaceAsync(
            CreatePrincipal(user, workspace.Id, [customRole.Name]),
            workspace.Id,
            PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task CanManageWorkspaceAsync_WhenSuperAdministratorTargetsDifferentWorkspace_ReturnsTrue()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var otherWorkspace = new Workspace
        {
            Id = Guid.CreateVersion7(),
            Name = TestFakers.CreateWorkspaceName(),
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.Workspaces.Add(otherWorkspace);
        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, SystemRoles.SuperAdministrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.CanManageWorkspaceAsync(
            CreatePrincipal(user, workspace.Id, [SystemRoles.SuperAdministrator]),
            otherWorkspace.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenSuperAdministratorRoleAssigned_ReturnsTrue()
    {
        await using var testDbContext = await CreateDbContextAsync();
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, SystemRoles.SuperAdministrator)
        });
        await dbContext.SaveChangesAsync();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
    }

    [Fact]
    public async Task HasPermissionAsync_WhenPermissionChecked_ExecutesTwoDatabaseQueries()
    {
        var commandCounter = new CommandCounterInterceptor();

        await using var testDbContext = await CreateDbContextAsync(commandCounter);
        var dbContext = testDbContext.DbContext;
        var workspace = await dbContext.Workspaces.SingleAsync();
        var user = await CreateUserAsync(dbContext, workspace.Id);

        dbContext.UserRoles.Add(new ApplicationUserRole
        {
            UserId = user.Id,
            RoleId = await GetRoleIdAsync(dbContext, StandardRoleNames.Administrator)
        });
        await dbContext.SaveChangesAsync();

        commandCounter.Reset();

        var service = new PermissionAuthorizationService(dbContext);

        var isAuthorized = await service.HasPermissionAsync(
            user.Id,
            (int)PermissionCode.Administrator_CanManage);

        Assert.True(isAuthorized);
        Assert.Equal(3, commandCounter.CommandCount);
    }

    private static ClaimsPrincipal CreatePrincipal(
        ApplicationUser user,
        Guid workspaceId,
        IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ApplicationClaimTypes.Subject, user.Id.ToString()),
            new(ApplicationClaimTypes.Name, user.UserName ?? string.Empty),
            new(ApplicationClaimTypes.WorkspaceId, workspaceId.ToString())
        };

        claims.AddRange(roles.Select(static role => new Claim(ApplicationClaimTypes.Role, role)));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }

    private static async Task<Guid> GetRoleIdAsync(ApplicationDbContext dbContext, string roleName)
    {
        return await dbContext.Roles
            .Where(role => role.Name == roleName)
            .Select(role => role.Id)
            .SingleAsync();
    }

    private static async Task<ApplicationUser> CreateUserAsync(ApplicationDbContext dbContext, Guid workspaceId)
    {
        var credentials = TestFakers.CreateUserCredentials();

        var user = new ApplicationUser
        {
            Id = Guid.CreateVersion7(),
            UserName = credentials.UserName,
            NormalizedUserName = credentials.UserName.ToUpperInvariant(),
            Email = credentials.Email,
            NormalizedEmail = credentials.Email.ToUpperInvariant(),
            RequirePasswordChange = false,
            WorkspaceId = workspaceId,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return user;
    }

    private static async Task<TestDbContext> CreateDbContextAsync(DbCommandInterceptor? interceptor = null)
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection);

        if (interceptor is not null)
        {
            optionsBuilder.AddInterceptors(interceptor);
        }

        var options = optionsBuilder.Options;

        var dbContext = new ApplicationDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        return new TestDbContext(connection, dbContext);
    }

    private sealed class TestDbContext : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;

        public TestDbContext(SqliteConnection connection, ApplicationDbContext dbContext)
        {
            _connection = connection;
            DbContext = dbContext;
        }

        public ApplicationDbContext DbContext { get; }

        public async ValueTask DisposeAsync()
        {
            await DbContext.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }

    private sealed class CommandCounterInterceptor : DbCommandInterceptor
    {
        public int CommandCount { get; private set; }

        public void Reset()
        {
            CommandCount = 0;
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            CommandCount++;

            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            CommandCount++;

            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }
    }
}

