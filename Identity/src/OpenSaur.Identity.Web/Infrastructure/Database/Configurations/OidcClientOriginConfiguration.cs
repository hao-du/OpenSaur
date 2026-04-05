using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Oidc;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Configurations;

internal sealed class OidcClientOriginConfiguration : IEntityTypeConfiguration<OidcClientOrigin>
{
    public void Configure(EntityTypeBuilder<OidcClientOrigin> builder)
    {
        builder.ToTable("OidcClientOrigins");
        builder.Property(origin => origin.BaseUri)
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(origin => origin.Description)
            .HasMaxLength(255);

        builder.HasIndex(origin => new { origin.OidcClientId, origin.BaseUri })
            .IsUnique();
    }
}
