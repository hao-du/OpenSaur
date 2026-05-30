using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class TransactionItemConfiguration : IEntityTypeConfiguration<TransactionItem>
{
    public void Configure(EntityTypeBuilder<TransactionItem> builder)
    {
        builder.ToTable("TransactionItems");

        builder.Property(x => x.Name)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(x => x.Amount)
            .HasPrecision(18, 4);

        builder.HasOne(x => x.CashFlow)
            .WithMany(x => x.TransactionItems)
            .HasForeignKey(x => x.CashFlowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.BankAccount)
            .WithMany(x => x.TransactionItems)
            .HasForeignKey(x => x.BankAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Transfer)
            .WithMany(x => x.TransactionItems)
            .HasForeignKey(x => x.TransferId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CurrencyExchange)
            .WithMany(x => x.TransactionItems)
            .HasForeignKey(x => x.CurrencyExchangeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
