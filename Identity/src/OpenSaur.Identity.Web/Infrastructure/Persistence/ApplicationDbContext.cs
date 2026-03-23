using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Persistence;

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
    private readonly ICurrentUserAccessor _currentUserAccessor;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : this(options, NullCurrentUserAccessor.Instance)
    {
    }

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserAccessor currentUserAccessor)
        : base(options)
    {
        _currentUserAccessor = currentUserAccessor;
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();

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
        var currentUserId = _currentUserAccessor.GetCurrentUserId();

        foreach (var entry in ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    ApplyAddedDefaults(entry.Entity, utcNow);
                    break;

                case EntityState.Modified:
                    ApplyUpdatedDefaults(entry.Entity, utcNow, currentUserId);
                    break;
            }
        }
    }

    private static void ApplyAddedDefaults(object entity, DateTime utcNow)
    {
        switch (entity)
        {
            case AuditedEntity auditedEntity:
                if (auditedEntity.Id == Guid.Empty)
                {
                    auditedEntity.Id = Guid.CreateVersion7();
                }

                if (auditedEntity.CreatedOn == default)
                {
                    auditedEntity.CreatedOn = utcNow;
                }

                break;

            case ApplicationUser user:
                if (user.Id == Guid.Empty)
                {
                    user.Id = Guid.CreateVersion7();
                }

                if (user.CreatedOn == default)
                {
                    user.CreatedOn = utcNow;
                }

                break;

            case ApplicationRole role:
                if (role.Id == Guid.Empty)
                {
                    role.Id = Guid.CreateVersion7();
                }

                if (role.CreatedOn == default)
                {
                    role.CreatedOn = utcNow;
                }

                break;

            case ApplicationUserRole userRole:
                if (userRole.Id == Guid.Empty)
                {
                    userRole.Id = Guid.CreateVersion7();
                }

                if (userRole.CreatedOn == default)
                {
                    userRole.CreatedOn = utcNow;
                }

                break;
        }
    }

    private static void ApplyUpdatedDefaults(object entity, DateTime utcNow, Guid? currentUserId)
    {
        switch (entity)
        {
            case AuditedEntity auditedEntity:
                auditedEntity.UpdatedOn = utcNow;
                if (currentUserId.HasValue)
                {
                    auditedEntity.UpdatedBy = currentUserId.Value;
                }
                break;

            case ApplicationUser user:
                user.UpdatedOn = utcNow;
                if (currentUserId.HasValue)
                {
                    user.UpdatedBy = currentUserId.Value;
                }
                break;

            case ApplicationRole role:
                role.UpdatedOn = utcNow;
                if (currentUserId.HasValue)
                {
                    role.UpdatedBy = currentUserId.Value;
                }
                break;

            case ApplicationUserRole userRole:
                userRole.UpdatedOn = utcNow;
                if (currentUserId.HasValue)
                {
                    userRole.UpdatedBy = currentUserId.Value;
                }
                break;
        }
    }
}
