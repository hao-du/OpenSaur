using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Features.Auth.Services;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

public sealed class ExchangeTokenHandler(
    TokenService tokenService)
{
    public async Task<IResult> HandleExchangeAsync(TokenExchangeRequest request)
    {
        if (!tokenService.IsAllowedOrigin())
        {
            return Results.Forbid();
        }

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = request.ClientId,
            ["code"] = request.Code,
            ["code_verifier"] = request.CodeVerifier,
            ["redirect_uri"] = request.RedirectUri
        };

        return await tokenService.ProxyTokenRequestAsync(form, clearRefreshCookieOnFailure: false);
    }
}
