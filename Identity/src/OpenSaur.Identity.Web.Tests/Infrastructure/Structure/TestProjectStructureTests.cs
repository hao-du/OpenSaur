namespace OpenSaur.Identity.Web.Tests.Infrastructure.Structure;

public sealed class TestProjectStructureTests
{
    [Fact]
    public void TestFiles_AreGroupedUnderDomainFeaturesAndInfrastructure()
    {
        var repositoryRoot = GetRepositoryRoot();
        var testsRoot = Path.Combine(repositoryRoot, "src", "OpenSaur.Identity.Web.Tests");

        Assert.True(Directory.Exists(Path.Combine(testsRoot, "Domain")));
        Assert.True(Directory.Exists(Path.Combine(testsRoot, "Features")));
        Assert.True(Directory.Exists(Path.Combine(testsRoot, "Infrastructure")));

        var legacyFeatureFolders = new[]
        {
            "Auth",
            "Outbox",
            "Permissions",
            "Roles",
            "UserRoles",
            "Users",
            "Workspaces"
        };

        var legacyInfrastructureFolders = new[]
        {
            "Authorization",
            "Database"
        };

        foreach (var folder in legacyFeatureFolders.Concat(legacyInfrastructureFolders))
        {
            Assert.False(
                Directory.Exists(Path.Combine(testsRoot, folder)),
                $"Legacy test folder '{folder}' should be moved under Domain, Features, or Infrastructure.");
        }
    }

    private static string GetRepositoryRoot()
    {
        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
    }
}
