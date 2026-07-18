using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class CurrencyConfiguration : IEntityTypeConfiguration<Currency>
{
    public void Configure(EntityTypeBuilder<Currency> builder)
    {
        builder.ToTable("Currencies");
        builder.Property(currency => currency.OwnerId).IsRequired();
        builder.Property(currency => currency.Name).HasMaxLength(200).IsRequired();
        builder.Property(currency => currency.ShortName).HasMaxLength(4).IsRequired();
        builder.Property(currency => currency.Description).HasMaxLength(500);
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(currency => currency.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(currency => new { currency.OwnerId, currency.ShortName }).IsUnique();
    }
}
