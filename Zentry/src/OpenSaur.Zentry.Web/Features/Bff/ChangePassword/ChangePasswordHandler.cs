using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Features.Bff.ChangePassword;

public static class ChangePasswordHandler
{
    public static IResult Handle(
        ChangePasswordRequest request,
        IOptions<OidcOptions> oidcOptions)
    {
        var authority = oidcOptions.Value.Authority?.TrimEnd('/') ?? string.Empty;
        if (string.IsNullOrWhiteSpace(authority))
        {
            return Results.Problem("Authority URL is not configured.", statusCode: StatusCodes.Status500InternalServerError);
        }

        var callbackUrl = !string.IsNullOrWhiteSpace(request.ReturnUrl)
            ? request.ReturnUrl
            : request.DefaultReturnUrl;

        var targetUrl = $"{authority}/change-password?returnUrl={Uri.EscapeDataString(callbackUrl)}";

        return Results.Redirect(targetUrl);
    }
}

