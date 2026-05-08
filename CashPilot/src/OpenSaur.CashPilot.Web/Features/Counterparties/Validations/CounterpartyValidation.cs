using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using System.Text.RegularExpressions;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

internal static class CounterpartyValidation
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneNumberRegex = new(@"^[0-9+\-() ]+$", RegexOptions.Compiled);

    public static string? ValidateCreate(CreateCounterpartyRequest request)
    {
        return ValidateCommon(request.FullName, request.Email, request.PhoneNumber, request.Description);
    }

    public static string? ValidateUpdate(UpdateCounterpartyRequest request)
    {
        return ValidateCommon(request.FullName, request.Email, request.PhoneNumber, request.Description);
    }

    private static string? ValidateCommon(string fullName, string? email, string? phoneNumber, string? description)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "Full name is required.";
        }

        if (fullName.Trim().Length > 100)
        {
            return "Full name cannot exceed 100 characters.";
        }

        var normalizedEmail = email?.Trim();
        if (normalizedEmail is not null && normalizedEmail.Length > 254)
        {
            return "Email cannot exceed 254 characters.";
        }

        if (!string.IsNullOrWhiteSpace(normalizedEmail) && !EmailRegex.IsMatch(normalizedEmail))
        {
            return "Invalid email format.";
        }

        var normalizedPhoneNumber = phoneNumber?.Trim();
        if (normalizedPhoneNumber is not null && normalizedPhoneNumber.Length > 25)
        {
            return "Phone number cannot exceed 25 characters.";
        }

        if (!string.IsNullOrWhiteSpace(normalizedPhoneNumber) && !PhoneNumberRegex.IsMatch(normalizedPhoneNumber))
        {
            return "Phone number format is invalid.";
        }

        if (description is not null && description.Trim().Length > 255)
        {
            return "Description cannot exceed 255 characters.";
        }

        return null;
    }
}
