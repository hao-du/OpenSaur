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
    public void EndpointTests_ReuseSharedFirstPartyApiBootstrapHelper()
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
            Assert.DoesNotContain("SeedOidcClientAsync(", source);
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

    [Fact]
    public void Tests_DoNotSeedUsersDirectlyThroughFactory()
    {
        var repositoryRoot = GetRepositoryRoot();
        var factoryFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "OpenSaurWebApplicationFactory.cs");
        var factorySource = File.ReadAllText(factoryFile);
        Assert.DoesNotContain("public async Task SeedUserAsync(", factorySource);

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Auth", "ApiAuthAccountEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Auth", "OidcAuthorizationFlowTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "ApiResponseEnvelopeTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "EndpointResilienceTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("_factory.SeedUserAsync(", source);
            Assert.DoesNotContain("factory.SeedUserAsync(", source);
        }
    }

    [Fact]
    public void Tests_ReuseSharedOrProductionApiContracts_ForCommonRequestAndResponseShapes()
    {
        var repositoryRoot = GetRepositoryRoot();

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Auth", "ApiAuthAccountEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Workspaces", "WorkspaceEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "ApiResponseEnvelopeTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Infrastructure", "Http", "EndpointResilienceTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private sealed record ChangePasswordRequest", source);
            Assert.DoesNotContain("private sealed record AuthMeResponse", source);
            Assert.DoesNotContain("private sealed record CreateWorkspaceRequest", source);
            Assert.DoesNotContain("private sealed record EditWorkspaceRequest", source);
            Assert.DoesNotContain("private sealed record ApiEnvelope<", source);
            Assert.DoesNotContain("private sealed record ApiError", source);
            Assert.DoesNotContain("private sealed record CreateUserRequest", source);
            Assert.DoesNotContain("private sealed record CreateUserResponse", source);
        }
    }

    [Fact]
    public void Tests_ReuseProductionApiContracts_ForNextExactMatchBatch()
    {
        var repositoryRoot = GetRepositoryRoot();

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Users", "UserEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Roles", "RoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "UserRoles", "UserRoleEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Permissions", "PermissionScopeEndpointsTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private sealed record CreateUserRequest", source);
            Assert.DoesNotContain("private sealed record EditUserRequest", source);
            Assert.DoesNotContain("private sealed record ChangeUserPasswordRequest", source);
            Assert.DoesNotContain("private sealed record ChangeUserWorkspaceRequest", source);
            Assert.DoesNotContain("private sealed record CreateRoleRequest", source);
            Assert.DoesNotContain("private sealed record EditRoleRequest", source);
            Assert.DoesNotContain("private sealed record RoleSummaryResponse", source);
            Assert.DoesNotContain("private sealed record RoleDetailResponse", source);
            Assert.DoesNotContain("private sealed record CreateUserRoleRequest", source);
            Assert.DoesNotContain("private sealed record EditUserRoleRequest", source);
            Assert.DoesNotContain("private sealed record UserRoleResponse", source);
            Assert.DoesNotContain("private sealed record PermissionResponse", source);
            Assert.DoesNotContain("private sealed record PermissionScopeResponse", source);
        }
    }

    [Fact]
    public void Tests_ReuseProductionApiContracts_ForRemainingExactMatchResponses()
    {
        var repositoryRoot = GetRepositoryRoot();

        var filesToCheck = new[]
        {
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Workspaces", "WorkspaceEndpointsTests.cs"),
            Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Users", "UserEndpointsTests.cs")
        };

        foreach (var file in filesToCheck)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("private sealed record WorkspaceResponse", source);
            Assert.DoesNotContain("private sealed record AuthMeResponse", source);
        }
    }

    [Fact]
    public void UserEndpointTests_ReuseProductionUserResponseContracts()
    {
        var repositoryRoot = GetRepositoryRoot();
        var file = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Users", "UserEndpointsTests.cs");
        var source = File.ReadAllText(file);

        Assert.DoesNotContain("private sealed record UserSummaryResponse", source);
        Assert.DoesNotContain("private sealed record UserDetailResponse", source);
    }

    [Fact]
    public void OidcFlowTests_ReuseSharedOidcTestHelper()
    {
        var repositoryRoot = GetRepositoryRoot();
        var supportFile = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Support", "OidcTestClient.cs");
        Assert.True(File.Exists(supportFile));

        var file = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests", "Features", "Auth", "OidcAuthorizationFlowTests.cs");
        var source = File.ReadAllText(file);

        Assert.DoesNotContain("private static async Task CompleteApiLoginAsync", source);
        Assert.DoesNotContain("private static async Task<string> AuthorizeAsync", source);
        Assert.DoesNotContain("private static async Task<OidcTokenResponse> ReadOidcTokenResponseAsync", source);
        Assert.DoesNotContain("private sealed record OidcTokenResponse", source);
    }

    private static string GetRepositoryRoot()
    {
        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
    }
}
