namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record ChangePasswordResponse(
    bool Success,
    string? RedirectUri,
    string? Error);
