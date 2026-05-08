using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class CashFlowConfiguration : IEntityTypeConfiguration<CashFlow>
{
    public void Configure(EntityTypeBuilder<CashFlow> builder)
    {
        builder.ToTable("CashFlows");
        builder.Property(cashFlow => cashFlow.TransactionId).IsRequired();
        builder.Property(cashFlow => cashFlow.IsIncome).IsRequired();

        builder.HasOne(cashFlow => cashFlow.Transaction)
            .WithMany(transaction => transaction.CashFlows)
            .HasForeignKey(cashFlow => cashFlow.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(cashFlow => cashFlow.TransactionId).IsUnique();
        builder.HasIndex(cashFlow => cashFlow.IsActive);
    }
}
