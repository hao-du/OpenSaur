namespace OpenSaur.Zentry.Web.Features.Users.ResetUserPassword;

public sealed record ResetUserPasswordRequest(
    Guid Id,
    string Password);
