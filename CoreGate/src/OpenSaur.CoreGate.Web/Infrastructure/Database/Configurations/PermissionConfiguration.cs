using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CoreGate.Web.Domain.Permissions;

namespace OpenSaur.CoreGate.Web.Infrastructure.Database.Configurations;

internal sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");
        builder.Property(permission => permission.Code).HasMaxLength(200).IsRequired();
        builder.Property(permission => permission.Rank).IsRequired();
        builder.Property(permission => permission.PermissionScopeId).IsRequired();
        builder.Property(permission => permission.Name).HasMaxLength(200).IsRequired();
        builder.Property(permission => permission.Description).HasMaxLength(255);
        builder.HasIndex(permission => permission.Code).IsUnique();
        builder.HasIndex(permission => permission.PermissionScopeId);
        builder.HasOne(permission => permission.PermissionScope)
            .WithMany()
            .HasForeignKey(permission => permission.PermissionScopeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
