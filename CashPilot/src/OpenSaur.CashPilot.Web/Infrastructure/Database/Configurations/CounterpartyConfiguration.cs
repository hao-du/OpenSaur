using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class CounterpartyConfiguration : IEntityTypeConfiguration<Counterparty>
{
    public void Configure(EntityTypeBuilder<Counterparty> builder)
    {
        builder.ToTable("Counterparties");
        builder.Property(counterparty => counterparty.OwnerId).IsRequired();
        builder.Property(counterparty => counterparty.FullName).HasMaxLength(100).IsRequired();
        builder.Property(counterparty => counterparty.Email).HasMaxLength(254);
        builder.Property(counterparty => counterparty.PhoneNumber).HasMaxLength(25);
        builder.Property(counterparty => counterparty.Description).HasMaxLength(255);
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(counterparty => counterparty.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(counterparty => new { counterparty.OwnerId, counterparty.FullName });
    }
}
