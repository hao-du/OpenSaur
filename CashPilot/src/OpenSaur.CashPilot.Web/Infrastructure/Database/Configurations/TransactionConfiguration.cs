using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.Property(transaction => transaction.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(transaction => transaction.Description).HasMaxLength(500);
        builder.Property(transaction => transaction.TransactedOn).IsRequired();

        builder.HasOne(transaction => transaction.Currency)
            .WithMany()
            .HasForeignKey(transaction => transaction.CurrencyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(transaction => transaction.CashFlows)
            .WithOne(cashFlow => cashFlow.Transaction)
            .HasForeignKey(cashFlow => cashFlow.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(transaction => transaction.TransactedOn);
        builder.HasIndex(transaction => transaction.IsActive);
    }
}
