using OpenSaur.Identity.Web.Features.Auth.ChangePassword;
using OpenSaur.Identity.Web.Features.Auth.Dashboard;
using OpenSaur.Identity.Web.Features.Auth.Login;
using OpenSaur.Identity.Web.Features.Auth.Logout;
using OpenSaur.Identity.Web.Features.Auth.Me;
using OpenSaur.Identity.Web.Features.Auth.Settings;
using OpenSaur.Identity.Web.Features.Auth.Impersonation;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;
using OpenSaur.Identity.Web.Infrastructure.Http.Metadata;
using OpenSaur.Identity.Web.Infrastructure.Http.RateLimiting;

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

        auth.MapGet("/dashboard", GetDashboardSummaryHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api);

        auth.MapGet("/settings", GetCurrentUserSettingsHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api);

        auth.MapPut("/settings", UpdateCurrentUserSettingsHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        auth.MapGet("/impersonation/options/{workspaceId:guid}", GetImpersonationOptionsHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true);

        auth.MapPost("/impersonation/start", StartImpersonationHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true)
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        auth.MapPost("/impersonation/exit", ExitImpersonationHandler.HandleAsync)
            .RequireAuthorization(AuthorizationPolicies.Api)
            .WithResilienceScope(EndpointResiliencePolicyScope.Auth);

        return app;
    }
}
