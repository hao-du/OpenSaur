using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Persistence.Configurations;

internal sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("Users");
        builder.Property(user => user.Description).HasMaxLength(255);
        builder.Property(user => user.UserSettings).HasColumnType("jsonb");
        builder.HasData(IdentitySeedData.GetUsers());
        builder.HasOne(user => user.Workspace)
            .WithMany(workspace => workspace.Users)
            .HasForeignKey(user => user.WorkspaceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
