using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class TransferConfiguration : IEntityTypeConfiguration<Transfer>
{
    public void Configure(EntityTypeBuilder<Transfer> builder)
    {
        builder.ToTable("Transfers");

        builder.Property(x => x.Amount)
            .HasPrecision(18, 4);

        builder.Property(x => x.TransferType)
            .HasConversion<byte>();

        builder.Property(x => x.Status)
            .HasConversion<byte>();
        
        builder.Property(x => x.Tags)
            .HasColumnType("jsonb");

        builder.HasOne(x => x.Counterparty)
            .WithMany()
            .HasForeignKey(x => x.CounterpartyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Currency)
            .WithMany()
            .HasForeignKey(x => x.CurrencyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
