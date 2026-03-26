namespace OpenSaur.Identity.Web.Features.Auth.WebSession;

public sealed record ExchangeWebSessionResponse(string AccessToken, DateTimeOffset ExpiresAt);
