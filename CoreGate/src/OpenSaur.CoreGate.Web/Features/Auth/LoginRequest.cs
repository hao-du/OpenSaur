namespace OpenSaur.CoreGate.Web.Features.Auth;

public sealed record LoginRequest(
    string UserName,
    string Password,
    string? ReturnUrl);
