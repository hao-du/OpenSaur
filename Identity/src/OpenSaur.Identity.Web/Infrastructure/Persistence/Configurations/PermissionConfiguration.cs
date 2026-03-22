using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Persistence.Configurations;

internal sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");
        builder.Property(permission => permission.Name).HasMaxLength(200).IsRequired();
        builder.Property(permission => permission.Description).HasMaxLength(255);
        builder.HasIndex(permission => permission.CodeId).IsUnique();
        builder.HasData(IdentitySeedData.GetPermissions());
    }
}
