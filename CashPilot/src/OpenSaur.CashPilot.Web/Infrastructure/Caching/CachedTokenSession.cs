namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public sealed record CachedTokenSession(
    string AccessToken,
    string RefreshToken,
    string ExpiresAt);
