using OpenSaur.Identity.Web.Features.OidcClients.CreateOidcClient;
using OpenSaur.Identity.Web.Features.OidcClients.DeleteOidcClient;
using OpenSaur.Identity.Web.Features.OidcClients.EditOidcClient;
using OpenSaur.Identity.Web.Features.OidcClients.GetOidcClientById;
using OpenSaur.Identity.Web.Features.OidcClients.GetOidcClients;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;

namespace OpenSaur.Identity.Web.Features.OidcClients;

public static class OidcClientEndpoints
{
    public static IEndpointRouteBuilder MapOidcClientEndpoints(this IEndpointRouteBuilder app)
    {
        var oidcClients = app.MapGroup("/api/oidc-client")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true);

        oidcClients.MapGet("/get", GetOidcClientsHandler.HandleAsync);
        oidcClients.MapGet("/getbyid/{id:guid}", GetOidcClientByIdHandler.HandleAsync);
        oidcClients.MapPost("/create", CreateOidcClientHandler.HandleAsync)
            .RequireIdempotency();
        oidcClients.MapPut("/edit", EditOidcClientHandler.HandleAsync)
            .RequireIdempotency();
        oidcClients.MapDelete("/delete/{id:guid}", DeleteOidcClientHandler.HandleAsync);

        return app;
    }
}
