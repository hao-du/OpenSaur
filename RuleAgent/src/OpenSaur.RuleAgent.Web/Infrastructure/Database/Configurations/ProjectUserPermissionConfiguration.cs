using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database.Configurations;

internal sealed class ProjectUserPermissionConfiguration : IEntityTypeConfiguration<ProjectUserPermission>
{
    public void Configure(EntityTypeBuilder<ProjectUserPermission> builder)
    {
        builder.ToTable("ProjectUserPermissions");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Permission)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(p => new { p.ProjectId, p.UserId }).IsUnique();

        builder.HasOne(p => p.Project)
            .WithMany(proj => proj.Permissions)
            .HasForeignKey(p => p.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany(u => u.ProjectPermissions)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
