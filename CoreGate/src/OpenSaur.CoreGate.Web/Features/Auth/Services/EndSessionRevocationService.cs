using OpenIddict.Abstractions;
using OpenSaur.CoreGate.Web.Infrastructure.Security;
using System.Security.Claims;

namespace OpenSaur.CoreGate.Web.Features.Auth.Services;

public sealed class EndSessionRevocationService(
    IOpenIddictApplicationManager applicationManager,
    IOpenIddictAuthorizationManager authorizationManager,
    IOpenIddictTokenManager tokenManager)
{
    public async Task RevokeCurrentClientSessionAsync(
        ClaimsPrincipal principal,
        string? clientId,
        CancellationToken cancellationToken)
    {
        var subject = ClaimPrincipalHelpers.GetUserId(principal);
        if (string.IsNullOrWhiteSpace(subject))
        {
            return;
        }

        var applicationId = await ResolveApplicationIdAsync(clientId, cancellationToken);

        var authorizations = new List<object>();
        await foreach (var authorization in authorizationManager.FindAsync(
            subject,
            client: null,
            OpenIddictConstants.Statuses.Valid,
            type: null,
            scopes: null,
            cancellationToken))
        {
            authorizations.Add(authorization);
        }

        foreach (var authorization in authorizations)
        {
            if (!await MatchesApplicationAsync(
                    applicationId,
                    authorization,
                    authorizationManager.GetApplicationIdAsync,
                    cancellationToken))
            {
                continue;
            }

            await authorizationManager.TryRevokeAsync(authorization, cancellationToken);
        }

        var tokens = new List<object>();
        await foreach (var token in tokenManager.FindAsync(
            subject,
            client: null,
            OpenIddictConstants.Statuses.Valid,
            type: null,
            cancellationToken))
        {
            tokens.Add(token);
        }

        foreach (var token in tokens)
        {
            if (!await MatchesApplicationAsync(
                    applicationId,
                    token,
                    tokenManager.GetApplicationIdAsync,
                    cancellationToken))
            {
                continue;
            }

            await tokenManager.TryRevokeAsync(token, cancellationToken);
        }
    }

    private async Task<string?> ResolveApplicationIdAsync(string? clientId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return null;
        }

        var application = await applicationManager.FindByClientIdAsync(clientId, cancellationToken);
        return application is null
            ? null
            : await applicationManager.GetIdAsync(application, cancellationToken);
    }

    private static async Task<bool> MatchesApplicationAsync(
        string? expectedApplicationId,
        object entity,
        Func<object, CancellationToken, ValueTask<string?>> getApplicationIdAsync,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(expectedApplicationId))
        {
            return true;
        }

        var applicationId = await getApplicationIdAsync(entity, cancellationToken);
        return string.Equals(applicationId, expectedApplicationId, StringComparison.Ordinal);
    }
}
