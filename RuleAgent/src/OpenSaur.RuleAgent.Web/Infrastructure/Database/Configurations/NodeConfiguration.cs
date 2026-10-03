using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database.Configurations;

internal sealed class NodeConfiguration : IEntityTypeConfiguration<Node>
{
    public void Configure(EntityTypeBuilder<Node> builder)
    {
        builder.ToTable("Nodes");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Name).HasMaxLength(500).IsRequired();
        builder.Property(n => n.Description).HasMaxLength(1000);
        builder.Property(n => n.Content).HasColumnType("text").IsRequired();

        builder.Property(n => n.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(n => n.ProjectId).IsRequired(false);

        builder.HasOne(n => n.Workspace)
            .WithMany(w => w.Nodes)
            .HasForeignKey(n => n.WorkspaceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Project)
            .WithMany(p => p.Nodes)
            .HasForeignKey(n => n.ProjectId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasMany(n => n.Snapshots)
            .WithOne(s => s.Node)
            .HasForeignKey(s => s.NodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(n => n.AncestorPaths)
            .WithOne(nc => nc.Descendant)
            .HasForeignKey(nc => nc.DescendantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(n => n.DescendantPaths)
            .WithOne(nc => nc.Ancestor)
            .HasForeignKey(nc => nc.AncestorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(n => new { n.WorkspaceId, n.ProjectId });
        builder.HasIndex(n => n.Type);
    }
}
