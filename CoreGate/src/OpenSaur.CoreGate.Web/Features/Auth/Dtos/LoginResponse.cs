namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record LoginResponse(
    bool Success,
    string? RedirectUri,
    string? Error);
