using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OpenSaur.RuleAgent.Web.Domain;
using System.Text.Json;

namespace OpenSaur.RuleAgent.Web.Infrastructure.Database.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.UserName).HasMaxLength(256).IsRequired();
        builder.Property(u => u.FirstName).HasMaxLength(200).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Description).HasMaxLength(1000);
        builder.Property(u => u.UserSettings).HasColumnType("jsonb").IsRequired();

        var stringArrayConverter = new ValueConverter<string[], string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>());

        var stringArrayComparer = new ValueComparer<string[]>(
            (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
            c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c == null ? Array.Empty<string>() : c.ToArray());

        builder.Property(u => u.Roles)
            .HasColumnType("jsonb")
            .HasConversion(stringArrayConverter)
            .Metadata.SetValueComparer(stringArrayComparer);

        builder.Property(u => u.Permissions)
            .HasColumnType("jsonb")
            .HasConversion(stringArrayConverter)
            .Metadata.SetValueComparer(stringArrayComparer);

        builder.HasIndex(u => u.Email).IsUnique();
    }
}
