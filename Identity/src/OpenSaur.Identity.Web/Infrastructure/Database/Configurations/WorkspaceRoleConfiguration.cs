using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Seeding;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Configurations;

internal sealed class WorkspaceRoleConfiguration : IEntityTypeConfiguration<WorkspaceRole>
{
    public void Configure(EntityTypeBuilder<WorkspaceRole> builder)
    {
        builder.ToTable("WorkspaceRoles");
        builder.Property(workspaceRole => workspaceRole.Description).HasMaxLength(255);
        builder.HasIndex(workspaceRole => workspaceRole.Id).IsUnique();
        builder.HasIndex(workspaceRole => new { workspaceRole.WorkspaceId, workspaceRole.RoleId }).IsUnique();
        builder.HasOne(workspaceRole => workspaceRole.Workspace)
            .WithMany(workspace => workspace.WorkspaceRoles)
            .HasForeignKey(workspaceRole => workspaceRole.WorkspaceId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(workspaceRole => workspaceRole.Role)
            .WithMany(role => role.WorkspaceRoles)
            .HasForeignKey(workspaceRole => workspaceRole.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasData(IdentitySeedData.GetWorkspaceRoles());
    }
}
