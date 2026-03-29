using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Seeding;

internal static class IdentitySeedData
{
    private static readonly DateTime SeededOnUtc = new(2026, 3, 22, 0, 0, 0, DateTimeKind.Utc);

    private static readonly Guid SystemActorId = Guid.Parse("67be05c0-1f88-4a2c-86f4-d97ad4589135");
    private static readonly Guid AdministratorCanManageRolePermissionId = Guid.Parse("d0edb44d-1a1d-47f8-85fd-5998a2c0de0c");
    private static readonly Guid SystemAdministratorUserRoleAssignmentId = Guid.Parse("dcbe2a91-7e7f-4f7a-a053-f9553fcc2aba");
    private static readonly Guid PersonalWorkspaceAdministratorRoleAssignmentId = Guid.Parse("81a4f14f-27f9-4b8a-a360-b26e71877648");
    private static readonly Guid PersonalWorkspaceUserRoleAssignmentId = Guid.Parse("4dba0a76-675d-487d-9d0c-7e4bdbb98b7e");
    private const string SystemAdministratorPasswordHash = "AQAAAAIAAYagAAAAEOFFiUu7B4wSzY7A4i1/VLOUnRjvSDE14MryEaaq4/og63kvvhceW3RF1F+hb+ETlg==";

    private static readonly IReadOnlyDictionary<int, Guid> PermissionIds = new Dictionary<int, Guid>
    {
        [(int)PermissionCode.Administrator_CanManage] = Guid.Parse("52b23446-4b62-497f-b8ef-b254be4a7570"),
        [(int)PermissionCode.Administrator_CanView] = Guid.Parse("dd49a1d9-a22f-4906-9788-cd4e9f74af95")
    };

    internal static Guid PersonalWorkspaceId { get; } = Guid.Parse("e3a2d95a-9d31-4232-b617-1ea4cdc65f88");

    internal static Guid AdministratorRoleId { get; } = Guid.Parse("ebc29128-4abe-4456-9c09-f9348ddfe91c");

    internal static Guid SuperAdministratorRoleId { get; } = Guid.Parse("38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc");

    internal static Guid UserRoleId { get; } = Guid.Parse("1cf3d7a5-b4b3-4b08-b3a8-b5c62f5266b4");

    internal static Guid SystemAdministratorUserId { get; } = Guid.Parse("d2deace4-2350-42cd-bba6-c7b18cf54d39");

    internal static IEnumerable<ApplicationRole> GetRoles()
    {
        yield return CreateRole(AdministratorRoleId, StandardRoleNames.Administrator, "Default workspace-scoped administrator role.");
        yield return CreateRole(SuperAdministratorRoleId, SystemRoles.SuperAdministrator, "Default cross-workspace super administrator role.");
        yield return CreateRole(UserRoleId, StandardRoleNames.User, "Default base user role.");
    }

    internal static IEnumerable<ApplicationUser> GetUsers()
    {
        yield return new ApplicationUser
        {
            Id = SystemAdministratorUserId,
            UserName = "SystemAdministrator",
            NormalizedUserName = "SYSTEMADMINISTRATOR",
            Email = "SystemAdministrator@opensaur.local",
            NormalizedEmail = "SYSTEMADMINISTRATOR@OPENSAUR.LOCAL",
            EmailConfirmed = true,
            PasswordHash = SystemAdministratorPasswordHash,
            SecurityStamp = "d2deace4235042cdbba6c7b18cf54d39",
            ConcurrencyStamp = "d2deace4-2350-42cd-bba6-c7b18cf54d39",
            Description = "Default system administrator account.",
            IsActive = true,
            RequirePasswordChange = true,
            WorkspaceId = PersonalWorkspaceId,
            UserSettings = "{}",
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };
    }

    internal static IEnumerable<Workspace> GetWorkspaces()
    {
        yield return new Workspace
        {
            Id = PersonalWorkspaceId,
            Name = SystemWorkspaces.Personal,
            Description = "Default personal workspace.",
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };
    }

    internal static IEnumerable<Permission> GetPermissions()
    {
        foreach (var definition in PermissionCatalog.GetDefinitions())
        {
            yield return new Permission
            {
                Id = PermissionIds[definition.CodeId],
                CodeId = definition.CodeId,
                Code = definition.Code,
                Rank = definition.Rank,
                PermissionScopeId = definition.PermissionScopeId,
                Name = definition.Name,
                Description = definition.Description,
                IsActive = true,
                CreatedBy = SystemActorId,
                CreatedOn = SeededOnUtc
            };
        }
    }

    internal static IEnumerable<PermissionScope> GetPermissionScopes()
    {
        foreach (var definition in PermissionScopeCatalog.GetDefinitions())
        {
            yield return new PermissionScope
            {
                Id = definition.Id,
                Name = definition.Name,
                Description = definition.Description,
                IsActive = true,
                CreatedBy = SystemActorId,
                CreatedOn = SeededOnUtc
            };
        }
    }

    internal static IEnumerable<RolePermission> GetRolePermissions()
    {
        yield return new RolePermission
        {
            Id = AdministratorCanManageRolePermissionId,
            RoleId = AdministratorRoleId,
            PermissionId = PermissionIds[(int)PermissionCode.Administrator_CanManage],
            Description = "Default administrator permission assignment.",
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };
    }

    internal static IEnumerable<ApplicationUserRole> GetUserRoles()
    {
        yield return new ApplicationUserRole
        {
            Id = SystemAdministratorUserRoleAssignmentId,
            UserId = SystemAdministratorUserId,
            RoleId = SuperAdministratorRoleId,
            Description = "Default system administrator role assignment.",
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };
    }

    internal static IEnumerable<WorkspaceRole> GetWorkspaceRoles()
    {
        yield return new WorkspaceRole
        {
            Id = PersonalWorkspaceAdministratorRoleAssignmentId,
            WorkspaceId = PersonalWorkspaceId,
            RoleId = AdministratorRoleId,
            Description = "Default personal-workspace administrator role availability.",
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };

        yield return new WorkspaceRole
        {
            Id = PersonalWorkspaceUserRoleAssignmentId,
            WorkspaceId = PersonalWorkspaceId,
            RoleId = UserRoleId,
            Description = "Default personal-workspace user role availability.",
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc
        };
    }

    private static ApplicationRole CreateRole(Guid id, string name, string description)
    {
        return new ApplicationRole
        {
            Id = id,
            Name = name,
            NormalizedName = SystemRoles.Normalize(name),
            Description = description,
            IsActive = true,
            CreatedBy = SystemActorId,
            CreatedOn = SeededOnUtc,
            ConcurrencyStamp = id.ToString("N")
        };
    }
}
