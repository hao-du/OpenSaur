using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Database.Outbox;

public sealed class OutboxMessageRecordingTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private readonly OpenSaurWebApplicationFactory _factory;

    public OutboxMessageRecordingTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await FirstPartyApiTestClient.InitializeFactoryAsync(_factory);
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
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, [SystemRoles.User]);

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

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());

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

        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var targetUserId = await TestIdentitySeeder.SeedUserAsync(_factory, targetCredentials.UserName, targetCredentials.Password, []);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(_factory, TestFakers.CreateRoleName());
        var assignmentId = await TestIdentitySeeder.SeedUserRoleAsync(_factory, targetUserId, roleId);

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
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

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
        await TestIdentitySeeder.SeedUserAsync(_factory, managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var roleId = await TestIdentitySeeder.SeedRoleAsync(
            _factory,
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

}
