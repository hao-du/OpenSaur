using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Common;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Domain.Outbox;
using OpenSaur.Zentry.Web.Domain.Permissions;
using OpenSaur.Zentry.Web.Domain.Workspaces;

namespace OpenSaur.Zentry.Web.Infrastructure.Database;

public sealed class ApplicationDbContext
    : IdentityDbContext<
        ApplicationUser,
        ApplicationRole,
        Guid,
        IdentityUserClaim<Guid>,
        ApplicationUserRole,
        IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>,
        IdentityUserToken<Guid>>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();

    public DbSet<WorkspaceRole> WorkspaceRoles => Set<WorkspaceRole>();

    public DbSet<PermissionScope> PermissionScopes => Set<PermissionScope>();

    public DbSet<Permission> Permissions => Set<Permission>();

    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

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

        builder.UseOpenIddict<Guid>();
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
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
