using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class FirstPartyJwtTokenService
{
    private static readonly JsonWebTokenHandler TokenHandler = new();
    private readonly OidcOptions _oidcOptions;
    private readonly FirstPartyAuthOptions _firstPartyAuthOptions;

    public FirstPartyJwtTokenService(
        IOptions<OidcOptions> oidcOptions,
        IOptions<FirstPartyAuthOptions> firstPartyAuthOptions)
    {
        _oidcOptions = oidcOptions.Value;
        _firstPartyAuthOptions = firstPartyAuthOptions.Value;
    }

    public AccessTokenResult CreateToken(ApplicationUser user, IEnumerable<string> roles)
    {
        var issuedOnUtc = DateTime.UtcNow;
        var expiresAtUtc = issuedOnUtc.AddMinutes(_firstPartyAuthOptions.AccessTokenLifetimeMinutes);
        var claims = new List<Claim>
        {
            new(ApplicationClaimTypes.Name, user.UserName ?? string.Empty),
            new(ApplicationClaimTypes.Subject, user.Id.ToString()),
            new(ApplicationClaimTypes.TokenId, Guid.CreateVersion7().ToString()),
            new(ApplicationClaimTypes.PreferredUserName, user.UserName ?? string.Empty),
            new(ApplicationClaimTypes.RequirePasswordChange, user.RequirePasswordChange.ToString().ToLowerInvariant()),
            new(ApplicationClaimTypes.WorkspaceId, user.WorkspaceId.ToString())
        };

        claims.AddRange(roles.Select(static role => new Claim(ApplicationClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_firstPartyAuthOptions.SigningKey));
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Audience = _firstPartyAuthOptions.Audience,
            Expires = expiresAtUtc,
            IssuedAt = issuedOnUtc,
            Issuer = _oidcOptions.Issuer,
            Subject = new ClaimsIdentity(claims),
            SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
        };

        var token = TokenHandler.CreateToken(tokenDescriptor);

        return new AccessTokenResult(token, expiresAtUtc);
    }
}
