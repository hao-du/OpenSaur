using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database.Configurations;

internal sealed class ProjectSharedFileConfiguration : IEntityTypeConfiguration<ProjectSharedFile>
{
    public void Configure(EntityTypeBuilder<ProjectSharedFile> builder)
    {
        builder.ToTable("ProjectSharedFiles");
        builder.HasKey(psf => new { psf.ProjectId, psf.FileNodeId });

        builder.HasOne(psf => psf.Project)
            .WithMany(p => p.SharedFiles)
            .HasForeignKey(psf => psf.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(psf => psf.FileNode)
            .WithMany(n => n.SharedInProjects)
            .HasForeignKey(psf => psf.FileNodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(psf => psf.FileNodeId);
    }
}
