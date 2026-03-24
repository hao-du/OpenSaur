using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Roles;

public sealed class RoleEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private const string ClientId = "first-party-web";
    private const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    private const string ClientSecret = "test-first-party-secret";

    private readonly OpenSaurWebApplicationFactory _factory;

    public RoleEndpointsTests(OpenSaurWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.SeedOidcClientAsync(ClientId, RedirectUri, ClientSecret);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task GetRoles_WhenCallerCanManage_ReturnsSeededRoles()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/role/get");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<IReadOnlyList<RoleSummaryResponse>>();
        Assert.NotNull(payload);
        Assert.Contains(payload, role => role.Name == SystemRoles.Administrator);
        Assert.Contains(payload, role => role.Name == SystemRoles.SuperAdministrator);
        Assert.Contains(payload, role => role.Name == SystemRoles.User);
    }

    [Fact]
    public async Task GetRoleById_WhenRoleExists_ReturnsAssignedPermissionCodeIds()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        Guid administratorRoleId;
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            administratorRoleId = await dbContext.Roles
                .Where(role => role.Name == SystemRoles.Administrator)
                .Select(role => role.Id)
                .SingleAsync();
        }

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/role/getbyid/{administratorRoleId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<RoleDetailResponse>();
        Assert.NotNull(payload);
        Assert.Equal(administratorRoleId, payload.Id);
        Assert.Contains((int)PermissionCode.Administrator_CanManage, payload.PermissionCodeIds);
    }

    [Fact]
    public async Task PostCreate_WhenCallerCanManage_CreatesRoleWithAssignedPermissions()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        var roleName = TestFakers.CreateRoleName();

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await PostAsJsonWithIdempotencyAsync(
            client,
            "/api/role/create",
            new CreateRoleRequest(
                roleName,
                TestFakers.CreateDescription(),
                [(int)PermissionCode.Administrator_CanManage]));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var role = await dbContext.Roles.SingleAsync(candidate => candidate.Name == roleName);
        var permissionAssignments = await dbContext.RolePermissions
            .Where(candidate => candidate.RoleId == role.Id)
            .ToListAsync();

        Assert.Single(permissionAssignments);
        Assert.True(permissionAssignments[0].IsActive);
    }

    [Fact]
    public async Task PutEdit_WhenCallerCanManage_UpdatesRoleAndDeactivatesRemovedAssignments()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);
        var roleId = await SeedRoleAsync(
            TestFakers.CreateRoleName(),
            [(int)PermissionCode.Administrator_CanManage]);

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await PutAsJsonWithIdempotencyAsync(
            client,
            "/api/role/edit",
            new EditRoleRequest(
                roleId,
                "Updated Role",
                TestFakers.CreateDescription(),
                IsActive: false,
                PermissionCodeIds: []));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var role = await dbContext.Roles.SingleAsync(candidate => candidate.Id == roleId);
        var permissionAssignments = await dbContext.RolePermissions
            .Where(candidate => candidate.RoleId == roleId)
            .ToListAsync();

        Assert.Equal("Updated Role", role.Name);
        Assert.False(role.IsActive);
        Assert.NotEmpty(permissionAssignments);
        Assert.All(permissionAssignments, assignment => Assert.False(assignment.IsActive));
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer),
                HandleCookies = true
            });
    }

    private async Task<Guid> SeedUserAsync(
        string userName,
        string password,
        IEnumerable<string> roles)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var workspace = await dbContext.Workspaces.SingleAsync();
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

    private async Task<Guid> SeedRoleAsync(string name, IReadOnlyCollection<int> permissionCodeIds)
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

        return role.Id;
    }

    private async Task<string> GetAccessTokenAsync(HttpClient client, string userName, string password)
    {
        var accessToken = await TryGetAccessTokenAsync(client, userName, password);

        return accessToken ?? throw new InvalidOperationException("Access token was expected.");
    }

    private async Task<string?> TryGetAccessTokenAsync(HttpClient client, string userName, string password)
    {
        var authorizeResponse = await client.GetAsync(CreateAuthorizeUrl());
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("FE login redirect was expected.");
        var loginQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(userName, password));
        if (loginResponse.StatusCode != HttpStatusCode.NoContent)
        {
            return null;
        }

        var callbackResponse = await client.GetAsync(returnUrl);
        if (callbackResponse.StatusCode != HttpStatusCode.Redirect
            || callbackResponse.Headers.Location is null
            || !string.Equals(callbackResponse.Headers.Location.GetLeftPart(UriPartial.Path), RedirectUri, StringComparison.Ordinal))
        {
            return null;
        }

        var callbackQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(callbackResponse.Headers.Location.Query);
        var authorizationCode = callbackQuery["code"].ToString();
        if (string.IsNullOrWhiteSpace(authorizationCode))
        {
            return null;
        }

        var tokenResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_id", ClientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("redirect_uri", RedirectUri),
                new KeyValuePair<string, string>("code", authorizationCode)
            ]));

        if (tokenResponse.StatusCode != HttpStatusCode.OK)
        {
            return null;
        }

        await using var payloadStream = await tokenResponse.Content.ReadAsStreamAsync();
        using var payload = await JsonDocument.ParseAsync(payloadStream);

        return payload.RootElement.GetProperty("access_token").GetString();
    }

    private static Task<HttpResponseMessage> PostAsJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        string requestUri,
        TRequest payload)
    {
        return SendJsonWithIdempotencyAsync(client, HttpMethod.Post, requestUri, payload);
    }

    private static Task<HttpResponseMessage> PutAsJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        string requestUri,
        TRequest payload)
    {
        return SendJsonWithIdempotencyAsync(client, HttpMethod.Put, requestUri, payload);
    }

    private static async Task<HttpResponseMessage> SendJsonWithIdempotencyAsync<TRequest>(
        HttpClient client,
        HttpMethod method,
        string requestUri,
        TRequest payload)
    {
        using var request = new HttpRequestMessage(method, requestUri)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString("N"));

        return await client.SendAsync(request);
    }

    private static string CreateAuthorizeUrl()
    {
        return Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(
            "/connect/authorize",
            new Dictionary<string, string?>
            {
                ["client_id"] = ClientId,
                ["redirect_uri"] = RedirectUri,
                ["response_type"] = "code",
                ["scope"] = "openid profile email roles offline_access api",
                ["state"] = "role-endpoints-state"
            });
    }

    private sealed record LoginRequest(string UserName, string Password);

    private sealed record CreateRoleRequest(string Name, string Description, int[] PermissionCodeIds);

    private sealed record EditRoleRequest(Guid Id, string Name, string Description, bool IsActive, int[] PermissionCodeIds);

    private sealed record RoleSummaryResponse(Guid Id, string Name, string Description, bool IsActive);

    private sealed record RoleDetailResponse(Guid Id, string Name, string Description, bool IsActive, int[] PermissionCodeIds);
}
