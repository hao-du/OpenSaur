using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OpenSaur.CashPilot.Web.Domain;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    private static readonly string[] CandidateObjectKeys = ["code", "name", "value", "permission", "role"];

    private static string[] DeserializeStringArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var direct = JsonSerializer.Deserialize<string[]>(json, (JsonSerializerOptions?)null);
            if (direct != null)
            {
                return direct;
            }
        }
        catch (JsonException)
        {
            // Fallback parser below handles legacy/object payloads.
        }

        try
        {
            var node = JsonNode.Parse(json) as JsonArray;
            if (node == null)
            {
                return [];
            }

            var values = new List<string>(node.Count);
            foreach (var item in node)
            {
                if (item == null)
                {
                    continue;
                }

                if (item is JsonValue valueNode)
                {
                    var value = valueNode.GetValue<string?>();
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        values.Add(value);
                    }

                    continue;
                }

                if (item is JsonObject objectNode)
                {
                    foreach (var key in CandidateObjectKeys)
                    {
                        if (objectNode.TryGetPropertyValue(key, out var propertyNode) && propertyNode is JsonValue propertyValueNode)
                        {
                            var value = propertyValueNode.GetValue<string?>();
                            if (!string.IsNullOrWhiteSpace(value))
                            {
                                values.Add(value);
                                break;
                            }
                        }
                    }
                }
            }

            return values.ToArray();
        }
        catch (JsonException)
        {
            return [];
        }
    }

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
            c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c == null ? Array.Empty<string>() : c.ToArray());

        var stringArrayConverter = new ValueConverter<string[], string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => DeserializeStringArray(v));

        builder.Property(user => user.Roles)
            .HasColumnType("jsonb")
            .HasConversion(stringArrayConverter)
            .Metadata.SetValueComparer(stringArrayComparer);

        builder.Property(user => user.Permissions)
            .HasColumnType("jsonb")
            .HasConversion(stringArrayConverter)
            .Metadata.SetValueComparer(stringArrayComparer);
    }
}
