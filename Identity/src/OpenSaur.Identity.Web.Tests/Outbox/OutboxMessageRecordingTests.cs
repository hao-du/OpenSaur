using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Outbox;

public sealed class OutboxMessageRecordingTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public OutboxMessageRecordingTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.SeedOidcClientAsync(
            FirstPartyApiTestClient.ClientId,
            FirstPartyApiTestClient.RedirectUri,
            FirstPartyApiTestClient.ClientSecret);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task PostCreateUser_WritesUserCreatedOutboxMessage()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var newUserCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Post,
            "/api/user/create",
            new
            {
                UserName = newUserCredentials.UserName,
                Email = TestFakers.CreateEmail(newUserCredentials.UserName),
                Password = newUserCredentials.Password,
                Description = TestFakers.CreateDescription(),
                UserSettings = "{\"theme\":\"dark\"}"
            });

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var createdUser = await dbContext.Users.SingleAsync(user => user.UserName == newUserCredentials.UserName);
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "UserCreated" && message.AggregateId == createdUser.Id);

        Assert.NotNull(outboxMessage);
        Assert.Equal("User", outboxMessage!.AggregateType);
        Assert.Equal("Pending", outboxMessage.Status);
        Assert.Equal(0, outboxMessage.Retries);
        Assert.Null(outboxMessage.ProcessedOn);

        using var payload = JsonDocument.Parse(outboxMessage.Payload);
        Assert.Equal(createdUser.Id, payload.RootElement.GetProperty("Id").GetGuid());
        Assert.Equal(createdUser.WorkspaceId, payload.RootElement.GetProperty("WorkspaceId").GetGuid());
        Assert.True(payload.RootElement.GetProperty("RequirePasswordChange").GetBoolean());
    }

    [Fact]
    public async Task PutEditUser_WhenSoftDeleted_WritesUserUpdatedOutboxMessageWithoutDeleteEvent()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Put,
            "/api/user/edit",
            new
            {
                Id = targetUserId,
                UserName = targetCredentials.UserName,
                Email = TestFakers.CreateEmail(targetCredentials.UserName),
                Description = TestFakers.CreateDescription(),
                IsActive = false,
                UserSettings = "{\"language\":\"vi\"}"
            });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "UserUpdated" && message.AggregateId == targetUserId);

        Assert.NotNull(outboxMessage);
        Assert.DoesNotContain(
            dbContext.OutboxMessages.Select(message => message.EventName).ToList(),
            static eventName => string.Equals(eventName, "UserDeleted", StringComparison.Ordinal));

        using var payload = JsonDocument.Parse(outboxMessage!.Payload);
        Assert.False(payload.RootElement.GetProperty("IsActive").GetBoolean());
    }

    [Fact]
    public async Task PostCreateUserRole_WritesUserRoleCreatedOutboxMessage()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await SeedRoleAsync(TestFakers.CreateRoleName());

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Post,
            "/api/user-role/create",
            new
            {
                UserId = targetUserId,
                RoleId = roleId,
                Description = TestFakers.CreateDescription()
            });

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var assignment = await dbContext.UserRoles.SingleAsync(candidate => candidate.UserId == targetUserId && candidate.RoleId == roleId);
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "UserRoleCreated" && message.AggregateId == assignment.Id);

        Assert.NotNull(outboxMessage);
        Assert.Equal("UserRole", outboxMessage!.AggregateType);

        using var payload = JsonDocument.Parse(outboxMessage.Payload);
        Assert.Equal(assignment.Id, payload.RootElement.GetProperty("Id").GetGuid());
        Assert.Equal(targetUserId, payload.RootElement.GetProperty("UserId").GetGuid());
        Assert.Equal(roleId, payload.RootElement.GetProperty("RoleId").GetGuid());
        Assert.True(payload.RootElement.GetProperty("IsActive").GetBoolean());
    }

    [Fact]
    public async Task PutEditUserRole_WritesUserRoleUpdatedOutboxMessageWithoutDeleteEvent()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        var targetCredentials = TestFakers.CreateUserCredentials();

        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await SeedUserAsync(targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await SeedRoleAsync(TestFakers.CreateRoleName());
        var assignmentId = await SeedUserRoleAsync(targetUserId, roleId);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Put,
            "/api/user-role/edit",
            new
            {
                Id = assignmentId,
                RoleId = roleId,
                Description = TestFakers.CreateDescription(),
                IsActive = false
            });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "UserRoleUpdated" && message.AggregateId == assignmentId);

        Assert.NotNull(outboxMessage);
        Assert.DoesNotContain(
            dbContext.OutboxMessages.Select(message => message.EventName).ToList(),
            static eventName => string.Equals(eventName, "UserRoleDeleted", StringComparison.Ordinal));

        using var payload = JsonDocument.Parse(outboxMessage!.Payload);
        Assert.False(payload.RootElement.GetProperty("IsActive").GetBoolean());
    }

    [Fact]
    public async Task PostCreateRole_WritesRolePermissionsCreatedOutboxMessage()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var roleName = TestFakers.CreateRoleName();
        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Post,
            "/api/role/create",
            new
            {
                Name = roleName,
                Description = TestFakers.CreateDescription(),
                PermissionCodeIds = new[] { (int)PermissionCode.Administrator_CanManage }
            });

        await ApiResponseReader.ReadSuccessDataAsync<JsonElement>(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var role = await dbContext.Roles.SingleAsync(candidate => candidate.Name == roleName);
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "RolePermissionsCreated" && message.AggregateId == role.Id);

        Assert.NotNull(outboxMessage);
        Assert.Equal("RolePermissionAssignment", outboxMessage!.AggregateType);

        using var payload = JsonDocument.Parse(outboxMessage.Payload);
        Assert.Equal(role.Id, payload.RootElement.GetProperty("RoleId").GetGuid());
        Assert.Equal(roleName, payload.RootElement.GetProperty("RoleName").GetString());
        Assert.Equal((int)PermissionCode.Administrator_CanManage, payload.RootElement.GetProperty("PermissionCodeIds")[0].GetInt32());
    }

    [Fact]
    public async Task PutEditRole_WritesRolePermissionsUpdatedOutboxMessage()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var roleId = await SeedRoleAsync(
            TestFakers.CreateRoleName(),
            [(int)PermissionCode.Administrator_CanManage]);

        using var client = FirstPartyApiTestClient.CreateClient(_factory);
        var accessToken = await FirstPartyApiTestClient.GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await FirstPartyApiTestClient.SendJsonWithIdempotencyAsync(
            client,
            HttpMethod.Put,
            "/api/role/edit",
            new
            {
                Id = roleId,
                Name = "Updated Role",
                Description = TestFakers.CreateDescription(),
                IsActive = false,
                PermissionCodeIds = Array.Empty<int>()
            });

        await ApiResponseReader.AssertNullSuccessDataAsync(response);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var outboxMessage = await dbContext.OutboxMessages.SingleOrDefaultAsync(
            message => message.EventName == "RolePermissionsUpdated" && message.AggregateId == roleId);

        Assert.NotNull(outboxMessage);

        using var payload = JsonDocument.Parse(outboxMessage!.Payload);
        Assert.Equal(roleId, payload.RootElement.GetProperty("RoleId").GetGuid());
        Assert.False(payload.RootElement.GetProperty("RoleIsActive").GetBoolean());
        Assert.Empty(payload.RootElement.GetProperty("PermissionCodeIds").EnumerateArray());
    }

    private async Task<Guid> SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles,
        string? workspaceName = null)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        Workspace workspace;
        if (string.IsNullOrWhiteSpace(workspaceName))
        {
            workspace = await dbContext.Workspaces.SingleAsync(workspaceEntity => workspaceEntity.Name == SystemWorkspaces.Personal);
        }
        else
        {
            workspace = new Workspace
            {
                Name = workspaceName,
                Description = TestFakers.CreateDescription(),
                CreatedBy = Guid.CreateVersion7()
            };

            dbContext.Workspaces.Add(workspace);
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
            IsActive = true,
            Description = TestFakers.CreateDescription(),
            CreatedBy = Guid.CreateVersion7()
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(error => error.Description)));
        }

        if (roles.Any())
        {
            var addRolesResult = await userManager.AddToRolesAsync(user, roles);
            if (!addRolesResult.Succeeded)
            {
                throw new InvalidOperationException(string.Join(", ", addRolesResult.Errors.Select(error => error.Description)));
            }
        }

        return user.Id;
    }

    private async Task<Guid> SeedRoleAsync(string name, IReadOnlyCollection<int>? permissionCodeIds = null)
    {
        using var scope = _factory.Services.CreateScope();
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

    private async Task<Guid> SeedUserRoleAsync(Guid userId, Guid roleId, bool isActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

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
