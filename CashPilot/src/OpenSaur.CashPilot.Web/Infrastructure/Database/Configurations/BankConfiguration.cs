using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class BankConfiguration : IEntityTypeConfiguration<Bank>
{
    public void Configure(EntityTypeBuilder<Bank> builder)
    {
        builder.ToTable("Banks");
        builder.Property(bank => bank.OwnerId).IsRequired();
        builder.Property(bank => bank.Name).HasMaxLength(200).IsRequired();
        builder.Property(bank => bank.ShortName).HasMaxLength(20).IsRequired();
        builder.Property(bank => bank.Description).HasMaxLength(500);
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(bank => bank.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(bank => new { bank.OwnerId, bank.ShortName }).IsUnique();
    }
}
