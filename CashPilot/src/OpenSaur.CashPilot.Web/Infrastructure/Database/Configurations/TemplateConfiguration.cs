using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class TemplateConfiguration : IEntityTypeConfiguration<Template>
{
    public void Configure(EntityTypeBuilder<Template> builder)
    {
        builder.ToTable("Templates");
        builder.Property(template => template.OwnerId).IsRequired();
        builder.Property(template => template.Name).HasMaxLength(200).IsRequired();
        builder.Property(template => template.Description).HasMaxLength(500);
        builder.Property(template => template.TemplateDataJson).HasColumnType("jsonb").IsRequired();
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(template => template.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(template => new { template.OwnerId, template.TemplateType, template.Name }).IsUnique();
    }
}
