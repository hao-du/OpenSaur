using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Outbox;

namespace OpenSaur.Identity.Web.Infrastructure.Persistence.Configurations;

internal sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");
        builder.Property(message => message.EventName).HasMaxLength(200).IsRequired();
        builder.Property(message => message.AggregateType).HasMaxLength(200).IsRequired();
        builder.Property(message => message.Description).HasMaxLength(255);
        builder.Property(message => message.Payload).HasColumnType("jsonb");
        builder.Property(message => message.Status).HasMaxLength(100).IsRequired();
        builder.Property(message => message.Error).HasMaxLength(255);
    }
}
