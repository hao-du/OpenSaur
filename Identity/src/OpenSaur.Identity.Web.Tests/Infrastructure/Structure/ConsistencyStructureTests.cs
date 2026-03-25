namespace OpenSaur.Identity.Web.Tests.Infrastructure.Structure;

public sealed class ConsistencyStructureTests
{
    [Fact]
    public void EndpointTests_ReuseSharedFirstPartyApiTestClientHelpers()
    {
        var repositoryRoot = GetRepositoryRoot();
        var supportFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Support", "FirstPartyApiTestClient.cs");
        Assert.True(File.Exists(supportFile));

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Users", "UserEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "UserRoles", "UserRoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Roles", "RoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Workspaces", "WorkspaceEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionScopeEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "ApiResponseEnvelopeTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "EndpointResilienceTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Auth", "ApiAuthAccountEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Database", "Outbox", "OutboxMessageRecordingTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private HttpClient CreateClient()", source);
            Assert.DoesNotContain("private static HttpClient CreateClient(", source);
            Assert.DoesNotContain("private async Task<string> GetAccessTokenAsync", source);
            Assert.DoesNotContain("private static async Task<string> GetAccessTokenAsync", source);
            Assert.DoesNotContain("private async Task<string?> TryGetAccessTokenAsync", source);
            Assert.DoesNotContain("private static async Task<string?> TryGetAccessTokenAsync", source);
            Assert.DoesNotContain("private static string CreateAuthorizeUrl()", source);
            Assert.DoesNotContain("private static Task<HttpResponseMessage> PostAsJsonWithIdempotencyAsync", source);
            Assert.DoesNotContain("private static Task<HttpResponseMessage> PutAsJsonWithIdempotencyAsync", source);
            Assert.DoesNotContain("private static async Task<HttpResponseMessage> SendJsonWithIdempotencyAsync", source);
        }
    }

    [Fact]
    public void UserValidators_ReuseSharedUserSettingsJsonHelper()
    {
        var repositoryRoot = GetRepositoryRoot();
        var helperFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Users", "UserSettingsJson.cs");
        Assert.True(File.Exists(helperFile));

        foreach (var file in new[]
                 {
                     Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Users", "CreateUser", "CreateUserRequestValidator.cs"),
                     Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Users", "EditUser", "EditUserRequestValidator.cs")
                 })
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private static bool BeValidJson", source);
            Assert.Contains(".Must(UserSettingsJson.IsValid)", source);
        }
    }

    [Fact]
    public void ValidationMappings_ReuseSharedHelper()
    {
        var repositoryRoot = GetRepositoryRoot();
        var helperFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Infrastructure", "Validation", "ValidationErrorMappings.cs");
        Assert.True(File.Exists(helperFile));

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Users", "UserValidationProblems.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Roles", "RoleValidationProblems.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web", "Features", "Auth", "ChangePassword", "ChangePasswordHandler.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("FromIdentityErrors(", source);
            Assert.DoesNotContain("ToValidationErrors(", source);
        }
    }

    [Fact]
    public void EndpointTests_ReuseSharedTestIdentitySeeder()
    {
        var repositoryRoot = GetRepositoryRoot();
        var helperFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Support", "TestIdentitySeeder.cs");
        Assert.True(File.Exists(helperFile));

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Users", "UserEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "UserRoles", "UserRoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Roles", "RoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Workspaces", "WorkspaceEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionScopeEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "ApiResponseEnvelopeTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Database", "Outbox", "OutboxMessageRecordingTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private async Task<Guid> SeedUserAsync", source);
            Assert.DoesNotContain("private async Task<Guid> SeedRoleAsync", source);
            Assert.DoesNotContain("private async Task<Guid> SeedWorkspaceAsync", source);
            Assert.DoesNotContain("private async Task<Guid> SeedUserRoleAsync", source);
        }
    }

    private static string GetRepositoryRoot()
    {
        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
    }
}
