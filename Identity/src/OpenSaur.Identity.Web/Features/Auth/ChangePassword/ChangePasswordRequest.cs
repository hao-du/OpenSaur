namespace OpenSaur.Identity.Web.Features.Auth.ChangePassword;

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
