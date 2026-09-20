using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Features.Auth.Handlers.OpenIddict;
using System.Net;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public static class ConsentEndpoints
{
    public static IEndpointRouteBuilder MapConsentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/consent", async (
            HttpContext context,
            IOpenIddictApplicationManager applicationManager,
            string? returnUrl) =>
        {
            var authResult = await context.AuthenticateAsync(IdentityConstants.ApplicationScheme);
            if (!authResult.Succeeded || authResult.Principal is null)
            {
                var redirectUrl = string.IsNullOrWhiteSpace(returnUrl)
                    ? "/login"
                    : $"/login?returnUrl={Uri.EscapeDataString(returnUrl)}";
                return Results.Redirect(redirectUrl);
            }

            if (string.IsNullOrWhiteSpace(returnUrl))
            {
                return Results.BadRequest("Missing returnUrl parameter.");
            }

            var queryIndex = returnUrl.IndexOf('?');
            var queryString = queryIndex >= 0 ? returnUrl[queryIndex..] : string.Empty;
            var query = QueryHelpers.ParseQuery(queryString);

            var clientId = query.TryGetValue("client_id", out var clientIdValues) ? clientIdValues.ToString() : null;
            var scopeString = query.TryGetValue("scope", out var scopeValues) ? scopeValues.ToString() : string.Empty;
            var scopes = scopeString.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var application = !string.IsNullOrWhiteSpace(clientId)
                ? await applicationManager.FindByClientIdAsync(clientId)
                : null;

            var clientDisplayName = application is not null
                ? await applicationManager.GetLocalizedDisplayNameAsync(application)
                    ?? await applicationManager.GetDisplayNameAsync(application)
                    ?? clientId
                : clientId;

            var html = RenderConsentHtml(clientDisplayName ?? "Unknown Client Application", scopes, returnUrl);
            return Results.Content(html, "text/html; charset=utf-8");
        }).AllowAnonymous();

        app.MapPost("/consent", async (ConsentHandler consentHandler) =>
            await consentHandler.HandleConsentAsync())
            .AllowAnonymous();

        return app;
    }

    private static string RenderConsentHtml(string clientDisplayName, string[] scopes, string returnUrl)
    {
        var encodedClientName = WebUtility.HtmlEncode(clientDisplayName);
        var encodedReturnUrl = WebUtility.HtmlEncode(returnUrl);

        var scopeListItems = scopes.Length == 0
            ? "<li>No specific scopes requested.</li>"
            : string.Join(string.Empty, scopes.Select(scope =>
            {
                var (title, description) = GetScopeMetadata(scope);
                return $@"
                    <li style=""margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;"">
                        <strong style=""color: #0f172a; display: block; font-size: 14px;"">{WebUtility.HtmlEncode(title)}</strong>
                        <span style=""color: #64748b; font-size: 13px;"">{WebUtility.HtmlEncode(description)}</span>
                    </li>";
            }));

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Authorization Consent - CoreGate</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 16px;
        }}
        .card {{
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
            width: 100%;
            max-width: 480px;
            padding: 32px;
        }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .header h1 {{ font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }}
        .header p {{ font-size: 14px; color: #64748b; line-height: 1.5; }}
        .scopes-container {{ margin-bottom: 28px; max-height: 240px; overflow-y: auto; }}
        .scopes-list {{ list-style: none; }}
        .actions {{ display: flex; gap: 12px; }}
        .btn {{
            flex: 1;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: background 0.15s ease, opacity 0.15s ease;
        }}
        .btn-primary {{
            background: #2563eb;
            color: #ffffff;
        }}
        .btn-primary:hover {{ background: #1d4ed8; }}
        .btn-secondary {{
            background: #e2e8f0;
            color: #334155;
        }}
        .btn-secondary:hover {{ background: #cbd5e1; }}
    </style>
</head>
<body>
    <div class=""card"">
        <div class=""header"">
            <h1>Authorization Request</h1>
            <p><strong>{encodedClientName}</strong> is requesting permission to access your CoreGate account.</p>
        </div>

        <div class=""scopes-container"">
            <ul class=""scopes-list"">
                {scopeListItems}
            </ul>
        </div>

        <form method=""post"" action=""/consent"">
            <input type=""hidden"" name=""returnUrl"" value=""{encodedReturnUrl}"" />
            <div class=""actions"">
                <button type=""submit"" name=""decision"" value=""reject"" class=""btn btn-secondary"">Deny</button>
                <button type=""submit"" name=""decision"" value=""accept"" class=""btn btn-primary"">Allow Access</button>
            </div>
        </form>
    </div>
</body>
</html>";
    }

    private static (string Title, string Description) GetScopeMetadata(string scope) => scope switch
    {
        OpenIddictConstants.Scopes.OpenId => ("Identity Verification", "Verify your user identity using OpenID Connect."),
        OpenIddictConstants.Scopes.Profile => ("Profile Information", "Access your name and public profile details."),
        OpenIddictConstants.Scopes.Email => ("Email Address", "View your registered email address."),
        OpenIddictConstants.Scopes.Roles => ("Role Assignments", "View the roles and privileges assigned to your account."),
        OpenIddictConstants.Scopes.OfflineAccess => ("Offline Access", "Maintain persistent access to your data when you are offline."),
        "api" => ("API Access", "Perform API actions on your behalf."),
        _ => (scope, $"Access permission for scope '{scope}'.")
    };
}
