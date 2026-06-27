using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class TagDefinitionConfiguration : IEntityTypeConfiguration<TagDefinition>
{
    public void Configure(EntityTypeBuilder<TagDefinition> builder)
    {
        builder.ToTable("TagDefinitions");

        builder.Property(x => x.Name)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(x => x.MatchingTerms)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.HasIndex(x => new { x.OwnerId, x.Name })
            .IsUnique();

        builder.Property(x => x.Marker)
            .IsRequired()
            .HasDefaultValue(false);
    }
}
