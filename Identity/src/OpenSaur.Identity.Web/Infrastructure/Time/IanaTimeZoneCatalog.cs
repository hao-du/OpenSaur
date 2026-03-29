using System.Reflection;
using System.Text.Json;

namespace OpenSaur.Identity.Web.Infrastructure.Time;

internal static class IanaTimeZoneCatalog
{
    private static readonly Lazy<HashSet<string>> SupportedTimeZones = new(LoadTimeZones);

    public static bool Contains(string timeZone)
    {
        return SupportedTimeZones.Value.Contains(timeZone);
    }

    private static HashSet<string> LoadTimeZones()
    {
        var assembly = typeof(IanaTimeZoneCatalog).Assembly;
        using var stream = assembly.GetManifestResourceStream("OpenSaur.Identity.Web.Infrastructure.Time.iana-timezones.json");
        if (stream is null)
        {
            throw new InvalidOperationException("The embedded IANA time zone catalog could not be loaded.");
        }

        using var document = JsonDocument.Parse(stream);
        return document.RootElement
            .EnumerateArray()
            .Select(static element => element.GetString())
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value!)
            .ToHashSet(StringComparer.Ordinal);
    }
}
