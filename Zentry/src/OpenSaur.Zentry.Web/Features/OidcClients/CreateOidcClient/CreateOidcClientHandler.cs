using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.OidcClients.CreateOidcClient;

public static class CreateOidcClientHandler
{
    public static async Task<Results<Ok<CreateOidcClientResponse>, ValidationProblem, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateOidcClientRequest request,
        IValidator<CreateOidcClientRequest> validator,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        try
        {
            var normalizedClientId = request.ClientId.Trim();
            var clientIdInUse = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
                .AsNoTracking()
                .AnyAsync(client => client.ClientId == normalizedClientId, cancellationToken);
            if (clientIdInUse)
            {
                return AppHttpResults.Conflict("Client id already exists.", "Another OIDC client already uses the provided client id.");
            }

            var descriptor = new OpenIddictApplicationDescriptor
            {
                ClientId = normalizedClientId,
                DisplayName = request.DisplayName.Trim(),
                ClientType = string.IsNullOrWhiteSpace(request.ClientSecret)
                    ? OpenIddictConstants.ClientTypes.Public
                    : OpenIddictConstants.ClientTypes.Confidential
            };
            if (!string.IsNullOrWhiteSpace(request.ClientSecret))
            {
                descriptor.ClientSecret = request.ClientSecret.Trim();
            }

            ApplyDescriptorConfiguration(
                descriptor,
                request.RedirectUris,
                request.PostLogoutRedirectUris,
                request.Scope);

            await applicationManager.CreateAsync(descriptor, cancellationToken);
            var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
                .AsNoTracking()
                .SingleAsync(client => client.ClientId == normalizedClientId, cancellationToken);

            return TypedResults.Ok(new CreateOidcClientResponse(application.Id));
        }
        catch (InvalidOperationException exception)
        {
            return AppHttpResults.BadRequest("Invalid OIDC client configuration.", exception.Message);
        }
    }

    internal static void ApplyDescriptorConfiguration(
        OpenIddictApplicationDescriptor descriptor,
        IEnumerable<string> redirectUris,
        IEnumerable<string> postLogoutRedirectUris,
        string scope)
    {
        descriptor.RedirectUris.Clear();
        descriptor.PostLogoutRedirectUris.Clear();
        descriptor.Permissions.Clear();
        descriptor.ConsentType = OpenIddictConstants.ConsentTypes.Implicit;

        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Authorization);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.Token);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.GrantTypes.RefreshToken);
        descriptor.Permissions.Add(OpenIddictConstants.Permissions.ResponseTypes.Code);

        foreach (var scopeValue in scope
                     .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                     .Distinct(StringComparer.Ordinal))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Prefixes.Scope + scopeValue);
        }

        foreach (var redirectUri in redirectUris
                     .Select(uri => uri.Trim())
                     .Where(uri => uri.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            descriptor.RedirectUris.Add(new Uri(redirectUri, UriKind.Absolute));
        }

        foreach (var postLogoutRedirectUri in postLogoutRedirectUris
                     .Select(uri => uri.Trim())
                     .Where(uri => uri.Length > 0)
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            descriptor.Permissions.Add(OpenIddictConstants.Permissions.Endpoints.EndSession);
            descriptor.PostLogoutRedirectUris.Add(new Uri(postLogoutRedirectUri, UriKind.Absolute));
        }
    }
}
