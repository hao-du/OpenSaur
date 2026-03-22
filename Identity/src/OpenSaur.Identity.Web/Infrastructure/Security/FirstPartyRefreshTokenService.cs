using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class FirstPartyRefreshTokenService
{
    private const string LoginProvider = "OpenSaur.FirstParty";
    private const string TokenName = "RefreshToken";

    private readonly IDataProtector _dataProtector;
    private readonly FirstPartyAuthOptions _options;
    private readonly UserManager<ApplicationUser> _userManager;

    public FirstPartyRefreshTokenService(
        IDataProtectionProvider dataProtectionProvider,
        IOptions<FirstPartyAuthOptions> options,
        UserManager<ApplicationUser> userManager)
    {
        _dataProtector = dataProtectionProvider.CreateProtector("OpenSaur.Identity.FirstParty.Refresh");
        _options = options.Value;
        _userManager = userManager;
    }

    public async Task IssueAsync(HttpContext httpContext, ApplicationUser user)
    {
        var rawToken = GenerateToken();
        var expiresAtUtc = DateTime.UtcNow.AddDays(_options.RefreshTokenLifetimeDays);
        var storedToken = new StoredRefreshToken(Hash(rawToken), expiresAtUtc);

        // NOTE: this is intentionally single-device/session for now.
        // Issuing a new refresh token replaces the previously issued token for the user.
        await _userManager.SetAuthenticationTokenAsync(
            user,
            LoginProvider,
            TokenName,
            JsonSerializer.Serialize(storedToken));

        var cookiePayload = new RefreshCookiePayload(user.Id, rawToken);
        var protectedPayload = _dataProtector.Protect(JsonSerializer.Serialize(cookiePayload));

        httpContext.Response.Cookies.Append(
            _options.RefreshCookieName,
            protectedPayload,
            new CookieOptions
            {
                Expires = expiresAtUtc,
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Strict,
                Secure = true
            });
    }

    public async Task<RefreshValidationResult> ValidateAsync(HttpContext httpContext)
    {
        if (!httpContext.Request.Cookies.TryGetValue(_options.RefreshCookieName, out var protectedPayload))
        {
            return RefreshValidationResult.Invalid;
        }

        RefreshCookiePayload? cookiePayload;
        try
        {
            var unprotectedPayload = _dataProtector.Unprotect(protectedPayload);
            cookiePayload = JsonSerializer.Deserialize<RefreshCookiePayload>(unprotectedPayload);
        }
        catch
        {
            return RefreshValidationResult.Invalid;
        }

        if (cookiePayload is null)
        {
            return RefreshValidationResult.Invalid;
        }

        var user = await _userManager.FindByIdAsync(cookiePayload.UserId.ToString());
        if (user is null)
        {
            return RefreshValidationResult.Invalid;
        }

        var storedTokenJson = await _userManager.GetAuthenticationTokenAsync(user, LoginProvider, TokenName);
        if (string.IsNullOrWhiteSpace(storedTokenJson))
        {
            return RefreshValidationResult.Invalid;
        }

        var storedToken = JsonSerializer.Deserialize<StoredRefreshToken>(storedTokenJson);
        if (storedToken is null || storedToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            return RefreshValidationResult.Invalid;
        }

        if (!CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(storedToken.TokenHash),
                Convert.FromHexString(Hash(cookiePayload.Token))))
        {
            return RefreshValidationResult.Invalid;
        }

        return RefreshValidationResult.Valid(user);
    }

    public async Task ClearAsync(HttpContext httpContext, ApplicationUser? user)
    {
        if (user is not null)
        {
            await _userManager.RemoveAuthenticationTokenAsync(user, LoginProvider, TokenName);
        }

        httpContext.Response.Cookies.Delete(
            _options.RefreshCookieName,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Strict,
                Secure = true
            });
    }

    private static string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    }

    private static string Hash(string rawToken)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
    }

    private sealed record RefreshCookiePayload(Guid UserId, string Token);

    private sealed record StoredRefreshToken(string TokenHash, DateTime ExpiresAtUtc);
}

public sealed record AccessTokenResult(string Token, DateTime ExpiresAtUtc);

public sealed class RefreshValidationResult
{
    private RefreshValidationResult(ApplicationUser? user)
    {
        User = user;
    }

    public ApplicationUser? User { get; }

    public static RefreshValidationResult Invalid { get; } = new(null);

    public bool IsValid => User is not null;

    public static RefreshValidationResult Valid(ApplicationUser user) => new(user);
}
