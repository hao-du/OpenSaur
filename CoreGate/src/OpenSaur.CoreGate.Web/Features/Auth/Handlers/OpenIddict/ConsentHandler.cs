using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Collections.Immutable;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;

public class ConsentHandler(
    IHttpContextAccessor httpContextAccessor,
    IOpenIddictApplicationManager applicationManager,
    IOpenIddictAuthorizationManager authorizationManager)
{
    public async Task<IResult> HandleConsentAsync()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("The HTTP context could not be resolved.");

        var authenticateResult = await httpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!authenticateResult.Succeeded || authenticateResult.Principal is null)
        {
            return Results.Redirect("/login");
        }

        var form = await httpContext.Request.ReadFormAsync();
        var decision = form["decision"].ToString();
        var returnUrl = form["returnUrl"].ToString();

        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return Results.BadRequest("Missing returnUrl parameter.");
        }

        if (string.Equals(decision, "accept", StringComparison.OrdinalIgnoreCase))
        {
            return await HandleAcceptAsync(authenticateResult.Principal, returnUrl, httpContext.RequestAborted);
        }

        return HandleReject(returnUrl);
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
            return Results.Forbid(
                authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme],
                properties: new AuthenticationProperties(new Dictionary<string, string?>
                {
                    [OpenIddictServerAspNetCoreConstants.Properties.Error] = OpenIddictConstants.Errors.AccessDenied,
                    [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The user denied the authorization request."
                }));
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
        return Results.Redirect(errorRedirectUrl);
    }

    private async Task<IResult> HandleAcceptAsync(
        System.Security.Claims.ClaimsPrincipal principal,
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
            return Results.BadRequest("Missing client_id in returnUrl.");
        }

        var application = await applicationManager.FindByClientIdAsync(clientId, cancellationToken);
        if (application is null)
        {
            return Results.BadRequest("Client application not found.");
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
        return Results.Redirect(resumeUrl);
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
