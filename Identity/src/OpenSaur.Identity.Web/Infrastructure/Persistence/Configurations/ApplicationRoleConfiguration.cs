using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Persistence.Configurations;

internal sealed class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.ToTable("Roles");
        builder.Property(role => role.Description).HasMaxLength(255);
        builder.HasData(IdentitySeedData.GetRoles());
    }
}
