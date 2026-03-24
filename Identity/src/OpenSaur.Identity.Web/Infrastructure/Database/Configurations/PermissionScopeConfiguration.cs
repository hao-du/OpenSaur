using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Permissions;
using OpenSaur.Identity.Web.Infrastructure.Database.Seeding;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Configurations;

internal sealed class PermissionScopeConfiguration : IEntityTypeConfiguration<PermissionScope>
{
    public void Configure(EntityTypeBuilder<PermissionScope> builder)
    {
        builder.ToTable("PermissionScopes");
        builder.Property(permissionScope => permissionScope.Name).HasMaxLength(200).IsRequired();
        builder.Property(permissionScope => permissionScope.Description).HasMaxLength(255);
        builder.HasIndex(permissionScope => permissionScope.Name).IsUnique();
        builder.HasData(IdentitySeedData.GetPermissionScopes());
    }
}
