using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.Property(user => user.UserName).HasMaxLength(256).IsRequired();
        builder.Property(user => user.Email).HasMaxLength(256).IsRequired();
        builder.Property(user => user.FirstName).HasMaxLength(200).IsRequired();
        builder.Property(user => user.LastName).HasMaxLength(200).IsRequired();
        builder.Property(user => user.WorkspaceName).HasMaxLength(200).IsRequired();
        builder.Property(user => user.UserSettings).HasColumnType("jsonb");
        builder.Property(user => user.Roles).HasColumnType("jsonb");
        builder.Property(user => user.Permissions).HasColumnType("jsonb");
    }
}
