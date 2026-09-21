using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Collections.Immutable;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class ConsentDecisionHandler(
    IOpenIddictApplicationManager applicationManager,
    IOpenIddictAuthorizationManager authorizationManager)
{
    public async Task<IResult> HandleAsync(
        ConsentDecisionRequest request,
        ClaimsPrincipal? user,
        CancellationToken cancellationToken = default)
    {
        if (user?.Identity is not { IsAuthenticated: true })
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.ReturnUrl))
        {
            return Results.BadRequest(new { error = "Missing returnUrl." });
        }

        if (string.Equals(request.Decision, "accept", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleAcceptAsync(user, request.ReturnUrl, cancellationToken);
        }

        return HandleReject(request.ReturnUrl);
    }

    private static IResult HandleReject(string returnUrl)
    {
        var queryIndex = returnUrl.IndexOf('?');
        var queryString = queryIndex >= 0 ? returnUrl[queryIndex..] : string.Empty;
        var query = QueryHelpers.ParseQuery(queryString);

        var redirectUri = query.TryGetValue("redirect_uri", out var redirectUriValues)
            ? redirectUriValues.ToString()
            : null;

        if (string.IsNullOrWhiteSpace(redirectUri))
        {
            return Results.BadRequest(new { error = "Missing redirect_uri in returnUrl." });
        }

        var errorParameters = new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            ["error"] = OpenIddictConstants.Errors.AccessDenied,
            ["error_description"] = "The user denied the authorization request."
        };

        if (query.TryGetValue("state", out var stateValues) && !string.IsNullOrWhiteSpace(stateValues))
        {
            errorParameters["state"] = stateValues.ToString();
        }

        var errorRedirectUrl = QueryHelpers.AddQueryString(redirectUri, errorParameters);
        return Results.Ok(new ConsentDecisionResponse(errorRedirectUrl));
    }

    private async Task<IResult> HandleAcceptAsync(
        ClaimsPrincipal principal,
        string returnUrl,
        CancellationToken cancellationToken)
    {
        var userId = ClaimPrincipalHelpers.GetUserId(principal)
            ?? throw new InvalidOperationException("User identifier could not be determined.");

        var queryIndex = returnUrl.IndexOf('?');
        var path = queryIndex >= 0 ? returnUrl[..queryIndex] : returnUrl;
        var queryString = queryIndex >= 0 ? returnUrl[queryIndex..] : string.Empty;
        var query = QueryHelpers.ParseQuery(queryString);

        var clientId = query.TryGetValue("client_id", out var clientIdValues) ? clientIdValues.ToString() : null;
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return Results.BadRequest(new { error = "Missing client_id in returnUrl." });
        }

        var application = await applicationManager.FindByClientIdAsync(clientId, cancellationToken);
        if (application is null)
        {
            return Results.BadRequest(new { error = "Client application not found." });
        }

        var applicationId = await applicationManager.GetIdAsync(application, cancellationToken)
            ?? throw new InvalidOperationException("Application ID could not be determined.");

        var scopeString = query.TryGetValue("scope", out var scopeValues) ? scopeValues.ToString() : string.Empty;
        var requestedScopes = scopeString.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var authorizations = new List<object>();
        await foreach (var auth in authorizationManager.FindAsync(
            userId,
            applicationId,
            OpenIddictConstants.Statuses.Valid,
            OpenIddictConstants.AuthorizationTypes.Permanent,
            scopes: null,
            cancellationToken))
        {
            authorizations.Add(auth);
        }

        var authorization = authorizations.FirstOrDefault();
        if (authorization is null)
        {
            await authorizationManager.CreateAsync(
                principal: principal,
                subject: userId,
                client: applicationId,
                type: OpenIddictConstants.AuthorizationTypes.Permanent,
                scopes: ImmutableArray.CreateRange(requestedScopes),
                cancellationToken: cancellationToken);
        }
        else
        {
            var descriptor = new OpenIddictAuthorizationDescriptor();
            await authorizationManager.PopulateAsync(descriptor, authorization, cancellationToken);
            descriptor.Scopes.UnionWith(requestedScopes);
            await authorizationManager.UpdateAsync(authorization, descriptor, cancellationToken);
        }

        var resumeUrl = StripConsentPromptFromUrl(path, query);
        return Results.Ok(new ConsentDecisionResponse(resumeUrl));
    }

    private static string StripConsentPromptFromUrl(string path, Dictionary<string, Microsoft.Extensions.Primitives.StringValues> query)
    {
        var filteredQuery = new Dictionary<string, string?>(StringComparer.Ordinal);
        foreach (var (key, value) in query)
        {
            if (string.Equals(key, "prompt", StringComparison.OrdinalIgnoreCase))
            {
                var promptValues = value.ToString()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(p => !string.Equals(p, OpenIddictConstants.PromptValues.Consent, StringComparison.OrdinalIgnoreCase))
                    .ToArray();

                if (promptValues.Length > 0)
                {
                    filteredQuery[key] = string.Join(' ', promptValues);
                }
            }
            else
            {
                filteredQuery[key] = value.ToString();
            }
        }

        return QueryHelpers.AddQueryString(path, filteredQuery);
    }
}

