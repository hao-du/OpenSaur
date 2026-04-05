using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Oidc;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Configurations;

internal sealed class OidcClientConfiguration : IEntityTypeConfiguration<OidcClient>
{
    public void Configure(EntityTypeBuilder<OidcClient> builder)
    {
        builder.ToTable("OidcClients");
        builder.Property(client => client.ClientId)
            .HasMaxLength(100)
            .IsRequired();
        builder.Property(client => client.ClientSecret)
            .HasMaxLength(512)
            .IsRequired();
        builder.Property(client => client.DisplayName)
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(client => client.AppPathBase)
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(client => client.Scope)
            .HasMaxLength(512)
            .IsRequired();
        builder.Property(client => client.Description)
            .HasMaxLength(255);

        builder.HasIndex(client => client.ClientId)
            .IsUnique();

        builder.HasMany(client => client.Origins)
            .WithOne(origin => origin.OidcClient)
            .HasForeignKey(origin => origin.OidcClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
