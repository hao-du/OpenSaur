using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

internal static class CurrencyValidation
{
    public static string? Validate(string name, string shortName)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return "Name is required.";
        }

        if (name.Trim().Length > 200)
        {
            return "Name cannot exceed 200 characters.";
        }

        if (string.IsNullOrWhiteSpace(shortName))
        {
            return "Short currency code is required.";
        }

        var normalizedShortName = shortName.Trim();
        if (normalizedShortName.Length < 3 || normalizedShortName.Length > 4)
        {
            return "Short currency code must be 3 or 4 characters.";
        }

        return null;
    }
}
