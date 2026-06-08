using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenSaur.CashPilot.Web.Features.Tags;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Services;

public sealed class TransactionAutoTagService(
    CashPilotDbContext dbContext,
    HttpClient httpClient,
    IOptions<AutoTaggingOptions> options)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly StringComparer TagComparer = StringComparer.OrdinalIgnoreCase;

    public async Task<AutoTagResponse> SuggestTagsAsync(
        Guid ownerId,
        AutoTagRequest request,
        CancellationToken cancellationToken)
    {
        var tagDefinitions = await dbContext.TagDefinitions
            .AsNoTracking()
            .Where(x => x.OwnerId == ownerId && x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new TagDefinitionPromptItem(x.Name, TagTermCodec.Decode(x.MatchingTerms)))
            .ToListAsync(cancellationToken);

        if (tagDefinitions.Count == 0)
        {
            return new AutoTagResponse([]);
        }

        var knownTagLookup = tagDefinitions
            .Select(x => x.Name)
            .Distinct(TagComparer)
            .ToDictionary(x => x, x => x, TagComparer);
        var description = request.Description?.Trim() ?? string.Empty;
        var deterministicTags = MatchTagsByTerms(description, tagDefinitions);
        if (description.Length == 0)
        {
            return new AutoTagResponse(FilterKnownTags(request.ExistingTags, knownTagLookup));
        }

        var configuredOptions = options.Value;
        if (string.IsNullOrWhiteSpace(configuredOptions.ApiKey))
        {
            throw new InvalidOperationException("AutoTagging:ApiKey is required to use Auto Tag.");
        }

        var modelTags = await RequestModelTagsAsync(
            configuredOptions,
            description,
            request.TransactionType,
            tagDefinitions,
            cancellationToken);

        return new AutoTagResponse(FilterKnownTags(
            request.ExistingTags.Concat(deterministicTags).Concat(modelTags),
            knownTagLookup));
    }

    private async Task<string[]> RequestModelTagsAsync(
        AutoTaggingOptions configuredOptions,
        string description,
        string? transactionType,
        IReadOnlyList<TagDefinitionPromptItem> tagDefinitions,
        CancellationToken cancellationToken)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, configuredOptions.Endpoint);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", configuredOptions.ApiKey);

        var payload = new
        {
            model = configuredOptions.Model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = """
                    You classify one financial transaction into existing user-defined tags.

                    Return only valid JSON in this exact shape:
                    {"tags":["tag name"]}

                    Rules:
                    - Use only tag names provided in the input.
                    - Do not invent new tags.
                    - Return an empty tags array only when no provided tag is relevant.
                    - Select every relevant tag when the description is similar to a tag name, matching term, or meaning.
                    - A matching term is a strong signal for that tag.
                    """
                },
                new
                {
                    role = "user",
                    content = JsonSerializer.Serialize(new
                    {
                        description,
                        transactionType,
                        tags = tagDefinitions.Select(x => new
                        {
                            name = x.Name,
                            matchingTerms = x.MatchingTerms
                        })
                    }, JsonOptions)
                }
            }
        };

        httpRequest.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
        var content = document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return ParseTags(content);
    }

    private static string[] ParseTags(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return [];
        }

        var trimmed = content.Trim();
        var jsonStart = trimmed.IndexOf('{');
        var jsonEnd = trimmed.LastIndexOf('}');
        if (jsonStart < 0)
        {
            jsonStart = trimmed.IndexOf('[');
            jsonEnd = trimmed.LastIndexOf(']');
        }

        if (jsonStart < 0 || jsonEnd < jsonStart)
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(trimmed[jsonStart..(jsonEnd + 1)]);
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                return ReadStringArray(document.RootElement);
            }

            if (!document.RootElement.TryGetProperty("tags", out var tagsElement) ||
                tagsElement.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            return ReadStringArray(tagsElement);
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string[] ReadStringArray(JsonElement tagsElement)
    {
        return tagsElement
            .EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString() ?? string.Empty)
            .ToArray();
    }

    private static string[] NormalizeTags(IEnumerable<string>? tags)
    {
        return (tags ?? [])
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(TagComparer)
            .ToArray();
    }

    private static string[] FilterKnownTags(
        IEnumerable<string>? tags,
        IReadOnlyDictionary<string, string> knownTagLookup)
    {
        return NormalizeTags(tags)
            .Select(tag => knownTagLookup.TryGetValue(tag, out var knownTag) ? knownTag : null)
            .Where(tag => tag != null)
            .Select(tag => tag!)
            .Distinct(TagComparer)
            .ToArray();
    }

    private static string[] MatchTagsByTerms(
        string description,
        IReadOnlyList<TagDefinitionPromptItem> tagDefinitions)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return [];
        }

        return tagDefinitions
            .Where(tag => TagMatchesDescription(tag, description))
            .Select(tag => tag.Name)
            .ToArray();
    }

    private static bool TagMatchesDescription(TagDefinitionPromptItem tag, string description)
    {
        return ContainsIgnoreCase(description, tag.Name) ||
            tag.MatchingTerms.Any(term => ContainsIgnoreCase(description, term));
    }

    private static bool ContainsIgnoreCase(string value, string term)
    {
        return !string.IsNullOrWhiteSpace(term) &&
            value.Contains(term.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private sealed record TagDefinitionPromptItem(string Name, string[] MatchingTerms);
}
