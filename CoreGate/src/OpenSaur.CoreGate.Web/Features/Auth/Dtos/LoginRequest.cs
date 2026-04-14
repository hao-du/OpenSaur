namespace OpenSaur.CoreGate.Web.Features.Auth.Dtos;

public sealed record LoginRequest(
    string UserName,
    string Password,
    string? ReturnUrl);
