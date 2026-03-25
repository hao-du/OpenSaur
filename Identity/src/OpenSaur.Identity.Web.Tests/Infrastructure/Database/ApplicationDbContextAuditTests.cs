using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Database;

public sealed class ApplicationDbContextAuditTests
{
    [Fact]
    public async Task SaveChangesAsync_WhenWorkspaceModifiedAndCurrentUserAvailable_SetsUpdatedBy()
    {
        var currentUserId = Guid.CreateVersion7();

        await using var testDbContext = await CreateDbContextAsync(currentUserId);
        var dbContext = testDbContext.DbContext;

        var workspace = await dbContext.Workspaces.SingleAsync();
        workspace.Description = TestFakers.CreateDescription();

        await dbContext.SaveChangesAsync();

        Assert.Equal(currentUserId, workspace.UpdatedBy);
        Assert.NotNull(workspace.UpdatedOn);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenApplicationUserModifiedAndCurrentUserAvailable_SetsUpdatedBy()
    {
        var currentUserId = Guid.CreateVersion7();

        await using var testDbContext = await CreateDbContextAsync(currentUserId);
        var dbContext = testDbContext.DbContext;

        var user = await dbContext.Users.SingleAsync(
            candidate => candidate.UserName == "SystemAdministrator");
        user.Description = TestFakers.CreateDescription();

        await dbContext.SaveChangesAsync();

        Assert.Equal(currentUserId, user.UpdatedBy);
        Assert.NotNull(user.UpdatedOn);
    }

    private static async Task<TestDbContext> CreateDbContextAsync(Guid? currentUserId = null)
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        var dbContext = new ApplicationDbContext(options, new StubCurrentUserAccessor(currentUserId));
        await dbContext.Database.EnsureCreatedAsync();

        return new TestDbContext(connection, dbContext);
    }

    private sealed class StubCurrentUserAccessor : ICurrentUserAccessor
    {
        public StubCurrentUserAccessor(Guid? userId)
        {
            UserId = userId;
        }

        public Guid? UserId { get; }

        public Guid? GetCurrentUserId() => UserId;
    }

    private sealed class TestDbContext : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;

        public TestDbContext(SqliteConnection connection, ApplicationDbContext dbContext)
        {
            _connection = connection;
            DbContext = dbContext;
        }

        public ApplicationDbContext DbContext { get; }

        public async ValueTask DisposeAsync()
        {
            await DbContext.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}
