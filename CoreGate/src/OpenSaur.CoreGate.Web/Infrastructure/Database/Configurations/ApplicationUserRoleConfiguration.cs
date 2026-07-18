using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Infrastructure.Database.Configurations;

internal sealed class ApplicationUserRoleConfiguration : IEntityTypeConfiguration<ApplicationUserRole>
{
    public void Configure(EntityTypeBuilder<ApplicationUserRole> builder)
    {
        builder.ToTable("UserRoles");
        builder.Property(userRole => userRole.Description).HasMaxLength(255);
        builder.HasIndex(userRole => userRole.Id).IsUnique();
        builder.HasIndex(userRole => new { userRole.UserId, userRole.RoleId }).IsUnique();
        builder.HasOne(userRole => userRole.User)
            .WithMany(user => user.UserRoles)
            .HasForeignKey(userRole => userRole.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(userRole => userRole.Role)
            .WithMany(role => role.UserRoles)
            .HasForeignKey(userRole => userRole.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
