using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Infrastructure.Database.Configurations;

internal sealed class NodeClosureConfiguration : IEntityTypeConfiguration<NodeClosure>
{
    public void Configure(EntityTypeBuilder<NodeClosure> builder)
    {
        builder.ToTable("NodeClosures");
        builder.HasKey(nc => new { nc.AncestorId, nc.DescendantId });

        builder.Property(nc => nc.Depth).IsRequired();

        builder.HasOne(nc => nc.Ancestor)
            .WithMany(n => n.DescendantPaths)
            .HasForeignKey(nc => nc.AncestorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(nc => nc.Descendant)
            .WithMany(n => n.AncestorPaths)
            .HasForeignKey(nc => nc.DescendantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(nc => nc.DescendantId);
        builder.HasIndex(nc => new { nc.AncestorId, nc.Depth });
    }
}
