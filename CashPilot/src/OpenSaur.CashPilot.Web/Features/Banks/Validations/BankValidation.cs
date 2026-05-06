using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using System.Linq.Expressions;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

internal static class BankValidation
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
            return "Short bank name is required.";
        }

        if (shortName.Trim().Length > 20)
        {
            return "Short bank name cannot exceed 20 characters.";
        }

        return null;
    }
}

