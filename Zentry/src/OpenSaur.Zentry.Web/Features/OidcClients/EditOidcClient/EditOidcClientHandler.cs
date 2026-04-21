using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;
using OpenSaur.Zentry.Web.Infrastructure.Database;

namespace OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;

public static class EditOidcClientHandler
{
    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        EditOidcClientRequest request,
        IValidator<EditOidcClientRequest> validator,
        ApplicationDbContext dbContext,
        IOpenIddictApplicationManager applicationManager,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var application = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
            .SingleOrDefaultAsync(client => client.Id == request.Id, cancellationToken);
        if (application is null)
        {
            return AppHttpResults.NotFound("OIDC client not found.", "No managed OIDC client matched the provided identifier.");
        }

        try
        {
            var normalizedClientId = request.ClientId.Trim();
            var clientIdInUse = await dbContext.Set<OpenIddictEntityFrameworkCoreApplication<Guid>>()
                .AsNoTracking()
                .AnyAsync(client => client.ClientId == normalizedClientId && client.Id != request.Id, cancellationToken);
            if (clientIdInUse)
            {
                return AppHttpResults.Conflict("Client id already exists.", "Another OIDC client already uses the provided client id.");
            }

            var descriptor = new OpenIddictApplicationDescriptor();
            await applicationManager.PopulateAsync(descriptor, application, cancellationToken);

            descriptor.ClientId = normalizedClientId;
            descriptor.DisplayName = request.DisplayName.Trim();
            descriptor.ClientType = request.ClientType.Trim();
            if (string.Equals(descriptor.ClientType, OpenIddictConstants.ClientTypes.Public, StringComparison.Ordinal))
            {
                descriptor.ClientSecret = null;
            }
            else if (!string.IsNullOrWhiteSpace(request.ClientSecret))
            {
                descriptor.ClientSecret = request.ClientSecret.Trim();
            }

            OidcClientHelper.ApplyDescriptorConfiguration(
                descriptor,
                request.ClientType,
                request.RedirectUris,
                request.PostLogoutRedirectUris,
                request.Scope);

            await applicationManager.UpdateAsync(application, descriptor, cancellationToken);

            return TypedResults.NoContent();
        }
        catch (InvalidOperationException exception)
        {
            return AppHttpResults.BadRequest("Invalid OIDC client configuration.", exception.Message);
        }
    }
}
