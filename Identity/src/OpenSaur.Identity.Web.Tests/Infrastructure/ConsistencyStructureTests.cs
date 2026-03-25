namespace OpenSaur.Identity.Web.Tests.Infrastructure;

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
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Users", "UserEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "UserRoles", "UserRoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Roles", "RoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Workspaces", "WorkspaceEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Permissions", "PermissionEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Permissions", "PermissionScopeEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "ApiResponseEnvelopeTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "EndpointResilienceTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Auth", "ApiAuthAccountEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Outbox", "OutboxMessageRecordingTests.cs")
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

    private static string GetRepositoryRoot()
    {
        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
    }
}
