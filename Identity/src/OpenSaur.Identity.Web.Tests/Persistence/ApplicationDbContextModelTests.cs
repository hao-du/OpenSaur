using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Persistence;

namespace OpenSaur.Identity.Web.Tests.Persistence;

public sealed class ApplicationDbContextModelTests
{
    [Fact]
    public void Model_MapsCustomFoundationTablesAndUserSettingsJson()
    {
        using var dbContext = CreateDbContext();

        var userEntity = dbContext.Model.FindEntityType(typeof(ApplicationUser));
        var userSettings = userEntity!.FindProperty(nameof(ApplicationUser.UserSettings));
        var userRoleEntity = dbContext.Model.FindEntityType(typeof(ApplicationUserRole));
        var userRolePrimaryKey = userRoleEntity!.FindPrimaryKey();

        Assert.Equal("Users", userEntity.GetTableName());
        Assert.Equal("jsonb", userSettings!.GetColumnType());
        Assert.Equal(
            [nameof(ApplicationUserRole.UserId), nameof(ApplicationUserRole.RoleId)],
            userRolePrimaryKey!.Properties.Select(static property => property.Name).ToArray());
        Assert.Contains(
            userRoleEntity.GetIndexes(),
            index => index.IsUnique
                     && index.Properties.Select(static property => property.Name)
                         .SequenceEqual([nameof(ApplicationUserRole.Id)]));
        Assert.Contains(
            userRoleEntity.GetIndexes(),
            index => index.IsUnique
                     && index.Properties.Select(static property => property.Name)
                         .SequenceEqual([nameof(ApplicationUserRole.UserId), nameof(ApplicationUserRole.RoleId)]));
        Assert.Equal("UserRoles", userRoleEntity.GetTableName());
        Assert.Equal("Workspaces", dbContext.Model.FindEntityType(typeof(Workspace))!.GetTableName());
        Assert.Equal("Permissions", dbContext.Model.FindEntityType(typeof(Permission))!.GetTableName());
        Assert.Equal("RolePermissions", dbContext.Model.FindEntityType(typeof(RolePermission))!.GetTableName());
        Assert.Equal("OutboxMessages", dbContext.Model.FindEntityType(typeof(OutboxMessage))!.GetTableName());
    }

    [Fact]
    public void Model_SeedsBaselineRolesWorkspaceAndPermissionCatalog()
    {
        using var dbContext = CreateDbContext();
        var designTimeModel = dbContext.GetService<IDesignTimeModel>().Model;

        var roleSeeds = designTimeModel.FindEntityType(typeof(ApplicationRole))!.GetSeedData();
        var userSeeds = designTimeModel.FindEntityType(typeof(ApplicationUser))!.GetSeedData();
        var userRoleSeeds = designTimeModel.FindEntityType(typeof(ApplicationUserRole))!.GetSeedData();
        var workspaceSeeds = designTimeModel.FindEntityType(typeof(Workspace))!.GetSeedData();
        var permissionSeeds = designTimeModel.FindEntityType(typeof(Permission))!.GetSeedData();
        var rolePermissionSeeds = designTimeModel.FindEntityType(typeof(RolePermission))!.GetSeedData();

        Assert.Contains(roleSeeds, seed => string.Equals(seed[nameof(ApplicationRole.Name)] as string, SystemRoles.Administrator, StringComparison.Ordinal));
        Assert.Contains(roleSeeds, seed => string.Equals(seed[nameof(ApplicationRole.Name)] as string, SystemRoles.SuperAdministrator, StringComparison.Ordinal));
        Assert.Contains(roleSeeds, seed => string.Equals(seed[nameof(ApplicationRole.Name)] as string, SystemRoles.User, StringComparison.Ordinal));

        var systemAdministratorSeed = userSeeds.Single(
            seed => string.Equals(seed[nameof(ApplicationUser.UserName)] as string, "SystemAdministrator", StringComparison.Ordinal));
        var superAdministratorRoleSeed = roleSeeds.Single(
            seed => string.Equals(seed[nameof(ApplicationRole.Name)] as string, SystemRoles.SuperAdministrator, StringComparison.Ordinal));

        Assert.True((bool)systemAdministratorSeed[nameof(ApplicationUser.IsActive)]!);
        Assert.True((bool)systemAdministratorSeed[nameof(ApplicationUser.RequirePasswordChange)]!);
        Assert.Equal("SYSTEMADMINISTRATOR", systemAdministratorSeed[nameof(ApplicationUser.NormalizedUserName)]);
        Assert.Equal("SYSTEMADMINISTRATOR@OPENSAUR.LOCAL", systemAdministratorSeed[nameof(ApplicationUser.NormalizedEmail)]);
        Assert.Equal("e3a2d95a-9d31-4232-b617-1ea4cdc65f88", systemAdministratorSeed[nameof(ApplicationUser.WorkspaceId)]!.ToString());

        var passwordHasher = new PasswordHasher<ApplicationUser>();
        var passwordVerificationResult = passwordHasher.VerifyHashedPassword(
            new ApplicationUser { UserName = "SystemAdministrator" },
            (string)systemAdministratorSeed[nameof(ApplicationUser.PasswordHash)]!,
            "Password1");

        Assert.NotEqual(PasswordVerificationResult.Failed, passwordVerificationResult);
        Assert.Contains(
            userRoleSeeds,
            seed => Equals(seed[nameof(ApplicationUserRole.UserId)], systemAdministratorSeed[nameof(ApplicationUser.Id)])
                    && Equals(seed[nameof(ApplicationUserRole.RoleId)], superAdministratorRoleSeed[nameof(ApplicationRole.Id)]));

        Assert.Contains(
            workspaceSeeds,
            seed => string.Equals(seed[nameof(Workspace.Name)] as string, SystemWorkspaces.Personal, StringComparison.Ordinal)
                    && Equals(seed[nameof(Workspace.IsActive)], true));
        Assert.Contains(
            permissionSeeds,
            seed => Equals(seed[nameof(Permission.CodeId)], (int)PermissionCode.Administrator_CanManage)
                    && string.Equals(seed[nameof(Permission.Name)] as string, "Can Manage", StringComparison.Ordinal));

        var administratorRoleSeed = roleSeeds.Single(
            seed => string.Equals(seed[nameof(ApplicationRole.Name)] as string, SystemRoles.Administrator, StringComparison.Ordinal));
        var administratorPermissionSeed = permissionSeeds.Single(
            seed => Equals(seed[nameof(Permission.CodeId)], (int)PermissionCode.Administrator_CanManage));

        Assert.Contains(
            rolePermissionSeeds,
            seed => Equals(seed[nameof(RolePermission.RoleId)], administratorRoleSeed[nameof(ApplicationRole.Id)])
                    && Equals(seed[nameof(RolePermission.PermissionId)], administratorPermissionSeed[nameof(Permission.Id)]));
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=opensaur_identity_tests;Username=test;Password=test")
            .Options;

        return new ApplicationDbContext(options);
    }
}
