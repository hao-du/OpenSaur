using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Domain.Common;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database;

public sealed class RuleAgentDbContext : DbContext
{
    public RuleAgentDbContext(DbContextOptions<RuleAgentDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectUserPermission> ProjectUserPermissions => Set<ProjectUserPermission>();
    public DbSet<Node> Nodes => Set<Node>();
    public DbSet<NodeClosure> NodeClosures => Set<NodeClosure>();
    public DbSet<NodeSnapshot> NodeSnapshots => Set<NodeSnapshot>();
    public DbSet<ProjectSharedFile> ProjectSharedFiles => Set<ProjectSharedFile>();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyRuntimeEntityDefaults();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyRuntimeEntityDefaults();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(RuleAgentDbContext).Assembly);
    }

    private void ApplyRuntimeEntityDefaults()
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    ApplyAddedDefaults(entry.Entity, utcNow);
                    break;

                case EntityState.Modified:
                    ApplyUpdatedDefaults(entry.Entity, utcNow);
                    break;
            }
        }
    }

    private static void ApplyAddedDefaults(object entity, DateTime utcNow)
    {
        if (entity is not IEntityBase record)
            return;

        if (record.Id == Guid.Empty)
            record.Id = Guid.CreateVersion7();

        if (record.CreatedOn == default)
            record.CreatedOn = utcNow;
    }

    private static void ApplyUpdatedDefaults(object entity, DateTime utcNow)
    {
        if (entity is IEntityBase record)
            record.UpdatedOn = utcNow;
    }
}
