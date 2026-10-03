using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database.Configurations;

internal sealed class NodeSnapshotConfiguration : IEntityTypeConfiguration<NodeSnapshot>
{
    public void Configure(EntityTypeBuilder<NodeSnapshot> builder)
    {
        builder.ToTable("NodeSnapshots");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.SnapshotContent).HasColumnType("text").IsRequired();
        builder.Property(s => s.Description).HasMaxLength(1000);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne(s => s.Node)
            .WithMany(n => n.Snapshots)
            .HasForeignKey(s => s.NodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.NodeId, s.CreatedOn });
        builder.HasIndex(s => s.Status);
    }
}
