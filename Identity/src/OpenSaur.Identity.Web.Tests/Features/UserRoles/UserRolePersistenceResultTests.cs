using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;
using OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Roles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.UserRoles;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Tests.Features.UserRoles;

public sealed class UserRolePersistenceResultTests
{
    [Fact]
    public async Task CreateUserRole_WhenDatabaseRejectsDuplicateAssignment_ReturnsValidationEnvelope()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var baseOptions = CreateOptions(connection);
        await using (var setupContext = new ApplicationDbContext(baseOptions))
        {
            await setupContext.Database.EnsureCreatedAsync();

            var workspaceId = await setupContext.Workspaces
                .Select(workspace => workspace.Id)
                .SingleAsync();

            setupContext.Users.Add(
                new ApplicationUser
                {
                    Id = Guid.CreateVersion7(),
                    UserName = "duplicate-target",
                    NormalizedUserName = "DUPLICATE-TARGET",
                    Email = "duplicate-target@opensaur.test",
                    NormalizedEmail = "DUPLICATE-TARGET@OPENSAUR.TEST",
                    WorkspaceId = workspaceId,
                    IsActive = true,
                    RequirePasswordChange = false,
                    CreatedBy = Guid.CreateVersion7()
                });

            setupContext.Roles.Add(
                new ApplicationRole
                {
                    Id = Guid.CreateVersion7(),
                    Name = "Duplicate Role",
                    NormalizedName = "DUPLICATE ROLE",
                    IsActive = true,
                    CreatedBy = Guid.CreateVersion7(),
                    ConcurrencyStamp = Guid.NewGuid().ToString("N")
                });

            await setupContext.SaveChangesAsync();
        }

        Guid userId;
        Guid roleId;
        Guid workspaceIdForContext;

        await using (var seededContext = new ApplicationDbContext(baseOptions))
        {
            userId = await seededContext.Users
                .Where(user => user.UserName == "duplicate-target")
                .Select(user => user.Id)
                .SingleAsync();
            roleId = await seededContext.Roles
                .Where(role => role.Name == "Duplicate Role")
                .Select(role => role.Id)
                .SingleAsync();
            workspaceIdForContext = await seededContext.Workspaces
                .Select(workspace => workspace.Id)
                .SingleAsync();
        }

        var duplicateInterceptor = new DuplicateUserRoleInsertInterceptor(connection, userId, roleId);
        var handlerOptions = CreateOptions(connection, duplicateInterceptor);
        await using var handlerContext = new ApplicationDbContext(handlerOptions);

        var result = await CreateUserRoleHandler.HandleAsync(
            new CreateUserRoleRequest(userId, roleId, "duplicate assignment"),
            new CreateUserRoleRequestValidator(),
            new CurrentUserContext(Guid.CreateVersion7(), workspaceIdForContext, false),
            handlerContext,
            new OutboxMessageWriter(handlerContext),
            new UserRepository(handlerContext),
            new RoleRepository(handlerContext),
            new UserRoleRepository(handlerContext),
            CancellationToken.None);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = CreateResultServices()
        };
        httpContext.Response.Body = new MemoryStream();

        await result.ExecuteAsync(httpContext);

        Assert.Equal(StatusCodes.Status400BadRequest, httpContext.Response.StatusCode);

        httpContext.Response.Body.Position = 0;
        using var payload = await JsonDocument.ParseAsync(httpContext.Response.Body);
        var root = payload.RootElement;

        Assert.False(root.GetProperty("success").GetBoolean());
        Assert.True(root.GetProperty("data").ValueKind is JsonValueKind.Null);

        var errors = root.GetProperty("errors");
        Assert.Single(errors.EnumerateArray());

        var error = errors[0];
        Assert.Equal("validation_error", error.GetProperty("code").GetString());
        Assert.Equal("Duplicate role assignment.", error.GetProperty("message").GetString());
        Assert.Equal("The user already has this role assignment.", error.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task EditUserRole_WhenDatabaseRejectsReplacementDuplicate_ReturnsValidationEnvelope()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var baseOptions = CreateOptions(connection);

        Guid workspaceId;
        Guid userId;
        Guid originalRoleId;
        Guid replacementRoleId;
        Guid assignmentId;

        await using (var setupContext = new ApplicationDbContext(baseOptions))
        {
            await setupContext.Database.EnsureCreatedAsync();

            workspaceId = await setupContext.Workspaces
                .Select(workspace => workspace.Id)
                .SingleAsync();

            var user = new ApplicationUser
            {
                Id = Guid.CreateVersion7(),
                UserName = "edit-duplicate-target",
                NormalizedUserName = "EDIT-DUPLICATE-TARGET",
                Email = "edit-duplicate-target@opensaur.test",
                NormalizedEmail = "EDIT-DUPLICATE-TARGET@OPENSAUR.TEST",
                WorkspaceId = workspaceId,
                IsActive = true,
                RequirePasswordChange = false,
                CreatedBy = Guid.CreateVersion7()
            };

            var originalRole = new ApplicationRole
            {
                Id = Guid.CreateVersion7(),
                Name = "Original Role",
                NormalizedName = "ORIGINAL ROLE",
                IsActive = true,
                CreatedBy = Guid.CreateVersion7(),
                ConcurrencyStamp = Guid.NewGuid().ToString("N")
            };

            var replacementRole = new ApplicationRole
            {
                Id = Guid.CreateVersion7(),
                Name = "Replacement Role",
                NormalizedName = "REPLACEMENT ROLE",
                IsActive = true,
                CreatedBy = Guid.CreateVersion7(),
                ConcurrencyStamp = Guid.NewGuid().ToString("N")
            };

            var assignment = new ApplicationUserRole
            {
                Id = Guid.CreateVersion7(),
                UserId = user.Id,
                RoleId = originalRole.Id,
                Description = "original assignment",
                IsActive = true,
                CreatedBy = Guid.CreateVersion7()
            };

            setupContext.Users.Add(user);
            setupContext.Roles.AddRange(originalRole, replacementRole);
            setupContext.UserRoles.Add(assignment);
            await setupContext.SaveChangesAsync();

            userId = user.Id;
            originalRoleId = originalRole.Id;
            replacementRoleId = replacementRole.Id;
            assignmentId = assignment.Id;
        }

        var duplicateInterceptor = new DuplicateUserRoleInsertInterceptor(connection, userId, replacementRoleId);
        var handlerOptions = CreateOptions(connection, duplicateInterceptor);
        await using var handlerContext = new ApplicationDbContext(handlerOptions);

        var result = await EditUserRoleHandler.HandleAsync(
            new EditUserRoleRequest(assignmentId, replacementRoleId, "edited assignment", true),
            new EditUserRoleRequestValidator(),
            new CurrentUserContext(Guid.CreateVersion7(), workspaceId, false),
            handlerContext,
            new OutboxMessageWriter(handlerContext),
            new RoleRepository(handlerContext),
            new UserRoleRepository(handlerContext),
            CancellationToken.None);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = CreateResultServices()
        };
        httpContext.Response.Body = new MemoryStream();

        await result.ExecuteAsync(httpContext);

        Assert.Equal(StatusCodes.Status400BadRequest, httpContext.Response.StatusCode);

        httpContext.Response.Body.Position = 0;
        using var payload = await JsonDocument.ParseAsync(httpContext.Response.Body);
        var root = payload.RootElement;

        Assert.False(root.GetProperty("success").GetBoolean());
        Assert.True(root.GetProperty("data").ValueKind is JsonValueKind.Null);

        var errors = root.GetProperty("errors");
        Assert.Single(errors.EnumerateArray());

        var error = errors[0];
        Assert.Equal("validation_error", error.GetProperty("code").GetString());
        Assert.Equal("Duplicate role assignment.", error.GetProperty("message").GetString());
        Assert.Equal("The user already has this role assignment.", error.GetProperty("detail").GetString());

        await using var verificationContext = new ApplicationDbContext(baseOptions);
        var assignments = await verificationContext.UserRoles
            .Where(candidate => candidate.UserId == userId)
            .OrderBy(candidate => candidate.CreatedOn)
            .ToListAsync();

        Assert.Single(assignments);
        Assert.Contains(assignments, candidate => candidate.Id == assignmentId && candidate.RoleId == originalRoleId);
        Assert.DoesNotContain(assignments, candidate => candidate.RoleId == replacementRoleId);
    }

    private static DbContextOptions<ApplicationDbContext> CreateOptions(
        SqliteConnection connection,
        params IInterceptor[] interceptors)
    {
        var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
        builder.UseSqlite(connection);
        builder.UseOpenIddict<Guid>();

        if (interceptors.Length > 0)
        {
            builder.AddInterceptors(interceptors);
        }

        return builder.Options;
    }

    private static IServiceProvider CreateResultServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        return services.BuildServiceProvider();
    }

    private sealed class DuplicateUserRoleInsertInterceptor(SqliteConnection connection, Guid userId, Guid roleId)
        : SaveChangesInterceptor
    {
        private bool _duplicateInserted;

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            if (_duplicateInserted || eventData.Context is not ApplicationDbContext context)
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var hasPendingAssignment = context.ChangeTracker.Entries<ApplicationUserRole>()
                .Any(entry =>
                    entry.State == EntityState.Added
                    && entry.Entity.UserId == userId
                    && entry.Entity.RoleId == roleId);

            if (!hasPendingAssignment)
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            _duplicateInserted = true;

            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
            builder.UseSqlite(connection);
            builder.UseOpenIddict<Guid>();

            var options = builder.Options;

            await using var duplicateContext = new ApplicationDbContext(options);
            duplicateContext.UserRoles.Add(
                new ApplicationUserRole
                {
                    UserId = userId,
                    RoleId = roleId,
                    Description = "duplicate",
                    IsActive = true,
                    CreatedBy = Guid.CreateVersion7()
                });
            await duplicateContext.SaveChangesAsync(cancellationToken);

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
