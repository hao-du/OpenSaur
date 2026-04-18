namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record TokenResponse(
    string AccessToken,
    int ExpiresIn,
    string TokenType,
    string? Scope,
    string? IdToken);
