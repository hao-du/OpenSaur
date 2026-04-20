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

        await foreach (var authorization in authorizationManager.FindBySubjectAsync(subject, cancellationToken))
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

        await foreach (var token in tokenManager.FindBySubjectAsync(subject, cancellationToken))
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
