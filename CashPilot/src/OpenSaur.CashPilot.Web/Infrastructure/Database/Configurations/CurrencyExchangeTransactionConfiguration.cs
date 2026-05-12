using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class CurrencyExchangeTransactionConfiguration : IEntityTypeConfiguration<CurrencyExchangeTransaction>
{
    public void Configure(EntityTypeBuilder<CurrencyExchangeTransaction> builder)
    {
        builder.ToTable("CurrencyExchangeTransactions");

        builder.HasOne(x => x.CurrencyExchange)
            .WithMany(x => x.CurrencyExchangeTransactions)
            .HasForeignKey(x => x.CurrencyExchangeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Transaction)
            .WithMany(x => x.CurrencyExchangeTransactions)
            .HasForeignKey(x => x.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
