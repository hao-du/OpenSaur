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

namespace OpenSaur.Identity.Web.Tests.Permissions;

public sealed class PermissionEndpointsTests : IClassFixture<OpenSaurWebApplicationFactory>, IAsyncLifetime
{
    private const string ClientId = "first-party-web";
    private const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    private const string ClientSecret = "test-first-party-secret";

    private readonly OpenSaurWebApplicationFactory _factory;

    public PermissionEndpointsTests(OpenSaurWebApplicationFactory factory)
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
    public async Task GetPermissions_WhenCallerCanManage_ReturnsDisplayMetadata()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("/api/permission/get");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<IReadOnlyList<PermissionResponse>>();
        Assert.NotNull(payload);

        var administratorCanManage = Assert.Single(payload, permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage);
        Assert.Equal("Administrator.CanManage", administratorCanManage.Code);
        Assert.False(string.IsNullOrWhiteSpace(administratorCanManage.Name));
        Assert.False(string.IsNullOrWhiteSpace(administratorCanManage.Description));
        Assert.Equal(PermissionScopeCatalog.AdministratorPermissionScopeId, administratorCanManage.PermissionScopeId);
        Assert.Equal("Administrator", administratorCanManage.PermissionScopeName);

        Assert.Contains(payload, permission => permission.CodeId == (int)PermissionCode.Administrator_CanView);
    }

    [Fact]
    public async Task GetPermissionById_WhenPermissionExists_ReturnsSelectionPayload()
    {
        var managerCredentials = TestFakers.CreateUserCredentials();
        await SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        int codeId;
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            codeId = await dbContext.Permissions
                .Where(permission => permission.CodeId == (int)PermissionCode.Administrator_CanManage)
                .Select(permission => permission.CodeId)
                .SingleAsync();
        }

        using var client = CreateClient();
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"/api/permission/getbyid/{codeId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PermissionResponse>();
        Assert.NotNull(payload);
        Assert.Equal(codeId, payload.CodeId);
        Assert.Equal("Administrator.CanManage", payload.Code);
        Assert.Equal(PermissionScopeCatalog.AdministratorPermissionScopeId, payload.PermissionScopeId);
        Assert.Equal("Administrator", payload.PermissionScopeName);
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
                ["state"] = "permission-endpoints-state"
            });
    }

    private sealed record LoginRequest(string UserName, string Password);

    private sealed record PermissionResponse(
        Guid Id,
        int CodeId,
        Guid PermissionScopeId,
        string PermissionScopeName,
        string Code,
        string Name,
        string Description,
        bool IsActive);
}
