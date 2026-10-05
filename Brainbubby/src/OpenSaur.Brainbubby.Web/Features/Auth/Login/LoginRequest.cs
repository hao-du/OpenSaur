namespace OpenSaur.Brainbubby.Web.Features.Auth.Login;

public record LoginRequest(string? ReturnUrl, bool IsAuthenticated);
