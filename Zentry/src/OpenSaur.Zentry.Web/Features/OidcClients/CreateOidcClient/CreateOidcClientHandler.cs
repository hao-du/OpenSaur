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
                ClientType = request.ClientType.Trim()
            };
            if (string.Equals(descriptor.ClientType, OpenIddictConstants.ClientTypes.Confidential, StringComparison.Ordinal)
                && !string.IsNullOrWhiteSpace(request.ClientSecret))
            {
                descriptor.ClientSecret = request.ClientSecret.Trim();
            }

            OidcClientHelper.ApplyDescriptorConfiguration(
                descriptor,
                request.ClientType,
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

}
