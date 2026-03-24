using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Filters;

public sealed class WorkspaceAccessFilter(bool restrictToSuperAdministrator) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var currentUserContext = CurrentUserContext.Create(context.HttpContext.User);
        if (currentUserContext is null)
        {
            return Results.Unauthorized();
        }

        var userAuthorizationService = context.HttpContext.RequestServices.GetRequiredService<UserAuthorizationService>();
        var hasWorkspaceAccess = await userAuthorizationService.HasWorkspaceAccessAsync(
            currentUserContext,
            restrictToSuperAdministrator,
            context.HttpContext.RequestAborted);
        if (!hasWorkspaceAccess)
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        return await next(context);
    }
}
