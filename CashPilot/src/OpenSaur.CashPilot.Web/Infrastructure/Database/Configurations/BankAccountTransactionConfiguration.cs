using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class BankAccountTransactionConfiguration : IEntityTypeConfiguration<BankAccountTransaction>
{
    public void Configure(EntityTypeBuilder<BankAccountTransaction> builder)
    {
        builder.ToTable("BankAccountTransactions");

        builder.Property(x => x.TransactionType)
            .HasConversion<byte>();

        builder.HasOne(x => x.BankAccount)
            .WithMany(x => x.BankAccountTransactions)
            .HasForeignKey(x => x.BankAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Transaction)
            .WithMany(x => x.BankAccountTransactions)
            .HasForeignKey(x => x.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
