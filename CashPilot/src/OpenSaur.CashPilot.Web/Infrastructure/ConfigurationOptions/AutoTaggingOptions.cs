namespace OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;

public sealed class AutoTaggingOptions
{
    public const string SectionName = "AutoTagging";

    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = "https://openrouter.ai/api/v1/chat/completions";
    public string Model { get; set; } = "openai/gpt-oss-20b:free";
}
