using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Tests.Features.Workspaces;

public sealed class WorkspacePersistenceResultTests
{
    [Fact]
    public async Task CreateWorkspace_WhenSecondSaveFails_RollsBackWorkspaceInsert()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var baseOptions = CreateOptions(connection);

        Guid workspaceId;
        Guid roleId;

        await using (var setupContext = new ApplicationDbContext(baseOptions))
        {
            await setupContext.Database.EnsureCreatedAsync();

            workspaceId = await setupContext.Workspaces
                .Select(workspace => workspace.Id)
                .SingleAsync();

            var role = new ApplicationRole
            {
                Id = Guid.CreateVersion7(),
                Name = "Content Writer",
                NormalizedName = "CONTENT_WRITER",
                IsActive = true,
                CreatedBy = Guid.CreateVersion7(),
                ConcurrencyStamp = Guid.NewGuid().ToString("N")
            };

            setupContext.Roles.Add(role);
            await setupContext.SaveChangesAsync();
            roleId = role.Id;
        }

        var failingOptions = CreateOptions(connection, new FailWhenWorkspaceRolesAreSavedInterceptor());

        await using (var failingContext = new ApplicationDbContext(failingOptions))
        {
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await CreateWorkspaceHandler.HandleAsync(
                    new CreateWorkspaceRequest("Atomic Workspace", "atomic create test", [roleId]),
                    new CreateWorkspaceRequestValidator(),
                    new CurrentUserContext(Guid.CreateVersion7(), workspaceId, true),
                    failingContext,
                    new OutboxMessageWriter(failingContext),
                    new WorkspaceRepository(failingContext),
                    CancellationToken.None));
        }

        await using var verificationContext = new ApplicationDbContext(baseOptions);
        Assert.False(await verificationContext.Workspaces.AnyAsync(workspace => workspace.Name == "Atomic Workspace"));
        Assert.False(await verificationContext.OutboxMessages.AnyAsync(message => message.EventName == OutboxEventNames.WorkspaceCreated));
    }

    private static DbContextOptions<ApplicationDbContext> CreateOptions(
        SqliteConnection connection,
        params IInterceptor[] interceptors)
    {
        var builder = new DbContextOptionsBuilder<ApplicationDbContext>();
        builder.UseSqlite(connection);
        builder.UseOpenIddict<Guid>();

        if (interceptors.Length > 0)
        {
            builder.AddInterceptors(interceptors);
        }

        return builder.Options;
    }

    private sealed class FailWhenWorkspaceRolesAreSavedInterceptor : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            if (eventData.Context is ApplicationDbContext context
                && context.ChangeTracker.Entries<WorkspaceRole>().Any(entry => entry.State == EntityState.Added))
            {
                throw new InvalidOperationException("Simulated workspace role save failure.");
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
