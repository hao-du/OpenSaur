using OpenSaur.Identity.Web.Features.Auth.ChangePassword;
using OpenSaur.Identity.Web.Features.Auth.Login;
using OpenSaur.Identity.Web.Features.Auth.Logout;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Resilience;

namespace OpenSaur.Identity.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapPost("/login", LoginHandler.HandleAsync)
            .AllowAnonymous()
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        auth.MapPost("/logout", (Delegate)LogoutHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        auth.MapPost("/change-password", ChangePasswordHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        auth.MapGet("/me", GetCurrentUserHandler.Handle)
            .RequireAuthorization(AuthorizationPolicies.Api);

        return app;
    }
}
