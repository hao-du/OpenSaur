namespace OpenSaur.Zentry.Web.Features.Auth.ChangePassword;

public sealed record ChangePasswordRequest(
    string? ReturnUrl,
    string DefaultReturnUrl);

