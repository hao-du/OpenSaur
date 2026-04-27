using OpenSaur.Zentry.Web.Features.OidcClients.CreateOidcClient;
using OpenSaur.Zentry.Web.Features.OidcClients.DeleteOidcClient;
using OpenSaur.Zentry.Web.Features.OidcClients.EditOidcClient;
using OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClientById;
using OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClients;
using OpenSaur.Zentry.Web.Infrastructure.Auth;

namespace OpenSaur.Zentry.Web.Features.OidcClients;

public static class OidcClientEndpoints
{
    public static IEndpointRouteBuilder MapOidcClientEndpoints(this IEndpointRouteBuilder app)
    {
        var oidcClients = app.MapGroup("/api/oidc-client")
            .RequireAuthorization(AppAuthorization.SuperAdminOnlyPolicyName);

        oidcClients.MapGet("/get", GetOidcClientsHandler.HandleAsync);
        oidcClients.MapGet("/getbyid/{id:guid}", GetOidcClientByIdHandler.HandleAsync);
        oidcClients.MapPost("/create", CreateOidcClientHandler.HandleAsync);
        oidcClients.MapPut("/edit", EditOidcClientHandler.HandleAsync);
        oidcClients.MapDelete("/delete/{id:guid}", DeleteOidcClientHandler.HandleAsync);

        return app;
    }
}
