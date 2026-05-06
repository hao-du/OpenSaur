using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database;

public sealed class CashPilotDbContext: DbContext
{
    public CashPilotDbContext(DbContextOptions<CashPilotDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Bank> Banks => Set<Bank>();

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

        builder.ApplyConfigurationsFromAssembly(typeof(CashPilotDbContext).Assembly);
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
        if (entity is not IEntityBase auditedRecord)
        {
            return;
        }

        if (auditedRecord.Id == Guid.Empty)
        {
            auditedRecord.Id = Guid.CreateVersion7();
        }

        if (auditedRecord.CreatedOn == default)
        {
            auditedRecord.CreatedOn = utcNow;
        }
    }

    private static void ApplyUpdatedDefaults(object entity, DateTime utcNow)
    {
        if (entity is IEntityBase auditedRecord)
        {
            auditedRecord.UpdatedOn = utcNow;
        }
    }
}
