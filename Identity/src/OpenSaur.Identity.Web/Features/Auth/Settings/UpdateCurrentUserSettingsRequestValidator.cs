using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Auth.Settings;

public sealed class UpdateCurrentUserSettingsRequestValidator : AbstractValidator<UpdateCurrentUserSettingsRequest>
{
    public UpdateCurrentUserSettingsRequestValidator()
    {
        RuleFor(request => request.Locale)
            .Must(CurrentUserSettingsJson.IsSupportedLocale)
            .WithMessage("Locale must be one of the supported values: en or vi.");

        RuleFor(request => request.TimeZone)
            .Must(CurrentUserSettingsJson.IsSupportedTimeZone)
            .WithMessage("Time zone must be a valid IANA time zone value.");
    }
}
