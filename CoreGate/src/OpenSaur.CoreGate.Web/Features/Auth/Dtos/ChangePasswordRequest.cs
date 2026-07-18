namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword,
    string? ReturnUrl);
