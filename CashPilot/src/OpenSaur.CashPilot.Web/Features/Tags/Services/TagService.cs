using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Tags.Services;

public sealed class TagService(CashPilotDbContext dbContext) : ITagService
{
    private static readonly StringComparer TagComparer = StringComparer.OrdinalIgnoreCase;

    public async Task EnsureTagDefinitionsExistAsync(
        Guid ownerId,
        IEnumerable<string> tagNames,
        CancellationToken cancellationToken)
    {
        var normalizedTagNames = tagNames
            .Select(NormalizeTagName)
            .Where(value => value.Length > 0)
            .Distinct(TagComparer)
            .ToList();

        if (normalizedTagNames.Count == 0)
        {
            return;
        }

        var existingNames = await dbContext.TagDefinitions
            .AsNoTracking()
            .Where(x => x.OwnerId == ownerId)
            .Select(x => x.Name)
            .ToListAsync(cancellationToken);

        var missingNames = normalizedTagNames
            .Where(tagName => existingNames.All(existingName => !TagComparer.Equals(existingName, tagName)))
            .ToList();

        if (missingNames.Count == 0)
        {
            return;
        }

        dbContext.TagDefinitions.AddRange(
            missingNames.Select(name => new TagDefinition
            {
                OwnerId = ownerId,
                Name = name,
                MatchingTerms = "[]",
                IsActive = true
            }));
    }

    public async Task EnsureTemplateTagDefinitionsExistAsync(
        Guid ownerId,
        string templateDataJson,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(templateDataJson))
        {
            return;
        }

        using var document = JsonDocument.Parse(templateDataJson);
        var tagNames = new List<string>();
        CollectTagNames(document.RootElement, tagNames);
        await EnsureTagDefinitionsExistAsync(ownerId, tagNames, cancellationToken);
    }

    private static void CollectTagNames(JsonElement element, ICollection<string> tagNames)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.TryGetProperty("tags", out var tagsElement) &&
                    tagsElement.ValueKind == JsonValueKind.Object &&
                    tagsElement.TryGetProperty("value", out var tagValuesElement) &&
                    tagValuesElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var valueElement in tagValuesElement.EnumerateArray())
                    {
                        if (valueElement.ValueKind == JsonValueKind.String)
                        {
                            var value = valueElement.GetString();
                            if (!string.IsNullOrWhiteSpace(value))
                            {
                                tagNames.Add(value);
                            }
                        }
                    }
                }

                foreach (var property in element.EnumerateObject())
                {
                    CollectTagNames(property.Value, tagNames);
                }
                break;
            case JsonValueKind.Array:
                foreach (var child in element.EnumerateArray())
                {
                    CollectTagNames(child, tagNames);
                }
                break;
        }
    }

    private static string NormalizeTagName(string value) => value.Trim();
}
