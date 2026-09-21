using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class GetConsentDetailsHandler(
    IOpenIddictApplicationManager applicationManager)
{
    private static readonly Dictionary<string, string> StandardScopeDescriptions = new(StringComparer.OrdinalIgnoreCase)
    {
        [OpenIddictConstants.Scopes.OpenId] = "Authenticate your identity using your CoreGate account",
        [OpenIddictConstants.Scopes.Profile] = "Access your profile information (display name, username)",
        [OpenIddictConstants.Scopes.Email] = "Access your email address",
        [OpenIddictConstants.Scopes.Roles] = "Read your assigned organizational and workspace roles",
        ["api"] = "Access APIs and granted system permissions on your behalf",
        [OpenIddictConstants.Scopes.OfflineAccess] = "Maintain offline access and refresh access tokens automatically"
    };

    public async Task<IResult> HandleAsync(
        GetConsentDetailsRequest request,
        ClaimsPrincipal? user,
        CancellationToken cancellationToken = default)
    {
        if (user?.Identity is not { IsAuthenticated: true })
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.ReturnUrl))
        {
            return Results.BadRequest(new { error = "Missing returnUrl parameter." });
        }

        var queryIndex = request.ReturnUrl.IndexOf('?');
        var queryString = queryIndex >= 0 ? request.ReturnUrl[queryIndex..] : string.Empty;
        var query = QueryHelpers.ParseQuery(queryString);

        var clientId = query.TryGetValue("client_id", out var clientIdValues) ? clientIdValues.ToString() : null;
        var scopeString = query.TryGetValue("scope", out var scopeValues) ? scopeValues.ToString() : string.Empty;
        var rawScopes = scopeString.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (string.IsNullOrWhiteSpace(clientId))
        {
            return Results.BadRequest(new { error = "Missing client_id in returnUrl." });
        }

        var application = await applicationManager.FindByClientIdAsync(clientId, cancellationToken);
        if (application is null)
        {
            return Results.BadRequest(new { error = "Client application not found." });
        }

        var clientDisplayName = await applicationManager.GetLocalizedDisplayNameAsync(application, cancellationToken)
            ?? await applicationManager.GetDisplayNameAsync(application, cancellationToken)
            ?? clientId;

        var scopeItems = rawScopes
            .Select(scope => new ConsentScopeItem(
                Name: scope,
                Description: StandardScopeDescriptions.TryGetValue(scope, out var desc)
                    ? desc
                    : $"Permission scope: {scope}"))
            .ToList();

        return Results.Ok(new ConsentDetailsResponse(
            ClientDisplayName: clientDisplayName,
            Scopes: scopeItems,
            ReturnUrl: request.ReturnUrl));
    }
}
