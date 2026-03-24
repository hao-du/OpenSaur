using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Tests.Database;

public sealed class DatabaseStructureTests
{
    [Fact]
    public void DatabaseInfrastructure_UsesDatabaseNamespaceInsteadOfPersistence()
    {
        Assert.Equal("OpenSaur.Identity.Web.Infrastructure.Database", typeof(ApplicationDbContext).Namespace);
        Assert.Null(typeof(Program).Assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Persistence.ApplicationDbContext"));
    }
}
