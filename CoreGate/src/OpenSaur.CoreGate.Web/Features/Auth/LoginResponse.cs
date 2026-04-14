namespace OpenSaur.CoreGate.Web.Features.Auth;

public sealed record LoginResponse(
    bool Success,
    string? RedirectUri,
    string? Error);
