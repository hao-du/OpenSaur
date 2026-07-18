using FluentValidation;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Settings.UpdateSettings;

public sealed class UpdateSettingsRequestValidator : AbstractValidator<UpdateSettingsRequest>
{
    public UpdateSettingsRequestValidator()
    {
        RuleFor(request => request.Locale)
            .Must(SettingsJson.IsSupportedLocale)
            .WithMessage("Locale must be one of the supported values: en or vi.");

        RuleFor(request => request.TimeZone)
            .Must(TimeZoneHelper.Contains)
            .WithMessage("Time zone must be a valid IANA time zone value.");
    }
}
