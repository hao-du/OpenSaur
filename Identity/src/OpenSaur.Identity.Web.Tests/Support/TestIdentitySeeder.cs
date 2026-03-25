using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Tests.Support;

public static class TestIdentitySeeder
{
    public static async Task<Guid> SeedUserAsync(
        OpenSaurWebApplicationFactory factory,
        string userName,
        string password,
        IEnumerable<string> roles,
        string? workspaceName = null,
        bool isActive = true,
        bool workspaceIsActive = true)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        Workspace workspace;
        if (string.IsNullOrWhiteSpace(workspaceName))
        {
            workspace = await dbContext.Workspaces.SingleAsync(
                workspaceEntity => workspaceEntity.Name == SystemWorkspaces.Personal);
        }
        else
        {
            workspace = await dbContext.Workspaces.SingleOrDefaultAsync(
                            workspaceEntity => workspaceEntity.Name == workspaceName)
                        ?? new Workspace
                        {
                            Name = workspaceName,
                            Description = TestFakers.CreateDescription(),
                            IsActive = workspaceIsActive,
                            CreatedBy = Guid.CreateVersion7()
                        };

            if (workspace.Id == Guid.Empty)
            {
                dbContext.Workspaces.Add(workspace);
                await dbContext.SaveChangesAsync();
            }
        }

        if (workspace.IsActive != workspaceIsActive)
        {
            workspace.IsActive = workspaceIsActive;
            await dbContext.SaveChangesAsync();
        }

        var existingUser = await userManager.FindByNameAsync(userName);
        if (existingUser is not null)
        {
            return existingUser.Id;
        }

        var user = new ApplicationUser
        {
            UserName = userName,
            Email = TestFakers.CreateEmail(userName),
            RequirePasswordChange = false,
            WorkspaceId = workspace.Id,
            IsActive = isActive,
            Description = TestFakers.CreateDescription(),
            CreatedBy = Guid.CreateVersion7()
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(error => error.Description)));
        }

        var roleList = roles.ToArray();
        if (roleList.Length > 0)
        {
            var addRolesResult = await userManager.AddToRolesAsync(user, roleList);
            if (!addRolesResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", addRolesResult.Errors.Select(error => error.Description)));
            }
        }

        return user.Id;
    }

    public static async Task<Guid> SeedWorkspaceAsync(
        OpenSaurWebApplicationFactory factory,
        string workspaceName,
        bool isActive = true)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var existingWorkspace = await dbContext.Workspaces.SingleOrDefaultAsync(
            workspace => workspace.Name == workspaceName);
        if (existingWorkspace is not null)
        {
            return existingWorkspace.Id;
        }

        var workspace = new Workspace
        {
            Name = workspaceName,
            Description = TestFakers.CreateDescription(),
            IsActive = isActive,
            CreatedBy = Guid.CreateVersion7()
        };

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync();

        return workspace.Id;
    }

    public static async Task<Guid> SeedRoleAsync(
        OpenSaurWebApplicationFactory factory,
        string name,
        IReadOnlyCollection<int>? permissionCodeIds = null)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        var existingRole = await roleManager.FindByNameAsync(name);
        if (existingRole is not null)
        {
            return existingRole.Id;
        }

        var role = new ApplicationRole
        {
            Name = name,
            Description = TestFakers.CreateDescription(),
            IsActive = true,
            CreatedBy = Guid.CreateVersion7()
        };

        var createResult = await roleManager.CreateAsync(role);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(error => error.Description)));
        }

        if (permissionCodeIds is { Count: > 0 })
        {
            var permissions = await dbContext.Permissions
                .Where(permission => permissionCodeIds.Contains(permission.CodeId))
                .ToListAsync();

            foreach (var permission in permissions)
            {
                dbContext.RolePermissions.Add(
                    new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionId = permission.Id,
                        Description = TestFakers.CreateDescription(),
                        CreatedBy = Guid.CreateVersion7()
                    });
            }

            await dbContext.SaveChangesAsync();
        }

        return role.Id;
    }

    public static async Task<Guid> SeedUserRoleAsync(
        OpenSaurWebApplicationFactory factory,
        Guid userId,
        Guid roleId,
        bool isActive = true)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var existingAssignment = await dbContext.UserRoles.SingleOrDefaultAsync(
            candidate => candidate.UserId == userId && candidate.RoleId == roleId);
        if (existingAssignment is not null)
        {
            return existingAssignment.Id;
        }

        var assignment = new ApplicationUserRole
        {
            UserId = userId,
            RoleId = roleId,
            Description = TestFakers.CreateDescription(),
            IsActive = isActive,
            CreatedBy = Guid.CreateVersion7(),
            CreatedOn = DateTime.UtcNow
        };

        dbContext.UserRoles.Add(assignment);
        await dbContext.SaveChangesAsync();

        return assignment.Id;
    }
}
