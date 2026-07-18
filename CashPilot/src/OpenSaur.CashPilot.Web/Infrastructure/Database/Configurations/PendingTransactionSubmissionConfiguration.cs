using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class PendingTransactionSubmissionConfiguration : IEntityTypeConfiguration<PendingTransactionSubmission>
{
    public void Configure(EntityTypeBuilder<PendingTransactionSubmission> builder)
    {
        builder.ToTable("PendingTransactionSubmissions");

        builder.Property(x => x.LocalTransactionId)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.PayloadJson)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.OwnerId, x.LocalTransactionId })
            .IsUnique();
    }
}
