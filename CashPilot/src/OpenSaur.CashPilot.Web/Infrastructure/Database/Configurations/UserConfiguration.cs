using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OpenSaur.CashPilot.Web.Domain;
using System.Text.Json;

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
        
        // UserSettings is already a string, so just mapping to jsonb is perfect
        builder.Property(user => user.UserSettings).HasColumnType("jsonb");

        // For string[], we must explicitly tell EF Core how to convert the array to/from a JSON string
        // We also provide a ValueComparer so EF Core knows when the array has been mutated
        var stringArrayComparer = new ValueComparer<string[]>(
            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c.ToArray());

        builder.Property(user => user.Roles)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>())
            .Metadata.SetValueComparer(stringArrayComparer);

        builder.Property(user => user.Permissions)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>())
            .Metadata.SetValueComparer(stringArrayComparer);
    }
}
