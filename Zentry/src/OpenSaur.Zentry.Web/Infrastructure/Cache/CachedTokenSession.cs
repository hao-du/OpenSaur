namespace OpenSaur.Zentry.Web.Infrastructure.Cache;

public sealed record CachedTokenSession(
    string AccessToken,
    string RefreshToken,
    string ExpiresAt);

