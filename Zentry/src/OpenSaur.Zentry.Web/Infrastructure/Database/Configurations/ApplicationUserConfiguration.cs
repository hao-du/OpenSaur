using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Zentry.Web.Domain.Identity;

namespace OpenSaur.Zentry.Web.Infrastructure.Database.Configurations;

internal sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("Users");
        builder.Property(user => user.Description).HasMaxLength(255);
        builder.Property(user => user.UserSettings).HasColumnType("jsonb");
        builder.HasOne(user => user.Workspace)
            .WithMany(workspace => workspace.Users)
            .HasForeignKey(user => user.WorkspaceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
