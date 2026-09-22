namespace OpenSaur.CashPilot.Web.Features.Auth.Logout;

public record LogoutRequest(string? ReturnUrl, bool IsAuthenticated);

