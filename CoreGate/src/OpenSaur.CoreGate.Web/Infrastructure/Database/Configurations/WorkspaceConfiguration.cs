using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CoreGate.Web.Domain.Workspaces;

namespace OpenSaur.CoreGate.Web.Infrastructure.Database.Configurations;

internal sealed class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        builder.ToTable("Workspaces");
        builder.Property(workspace => workspace.Name).HasMaxLength(200).IsRequired();
        builder.Property(workspace => workspace.Description).HasMaxLength(255);
        builder.Property(workspace => workspace.MaxActiveUsers);
    }
}
