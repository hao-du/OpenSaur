using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Zentry.Web.Domain.Permissions;

namespace OpenSaur.Zentry.Web.Infrastructure.Database.Configurations;

internal sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions");
        builder.Property(rolePermission => rolePermission.Description).HasMaxLength(255);
        builder.HasIndex(rolePermission => new { rolePermission.RoleId, rolePermission.PermissionId }).IsUnique();
        builder.HasOne(rolePermission => rolePermission.Role)
            .WithMany()
            .HasForeignKey(rolePermission => rolePermission.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(rolePermission => rolePermission.Permission)
            .WithMany()
            .HasForeignKey(rolePermission => rolePermission.PermissionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
