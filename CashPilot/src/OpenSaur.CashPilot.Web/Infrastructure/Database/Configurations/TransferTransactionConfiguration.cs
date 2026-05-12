using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

public sealed class TransferTransactionConfiguration : IEntityTypeConfiguration<TransferTransaction>
{
    public void Configure(EntityTypeBuilder<TransferTransaction> builder)
    {
        builder.ToTable("TransferTransactions");

        builder.HasOne(x => x.Transfer)
            .WithMany(x => x.TransferTransactions)
            .HasForeignKey(x => x.TransferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Transaction)
            .WithMany(x => x.TransferTransactions)
            .HasForeignKey(x => x.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
