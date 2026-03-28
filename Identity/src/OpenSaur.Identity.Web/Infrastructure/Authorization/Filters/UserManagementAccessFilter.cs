using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Filters;

public sealed class UserManagementAccessFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var currentUserContext = CurrentUserContext.Create(context.HttpContext.User);
        if (currentUserContext is null)
        {
            return Result.Unauthorized(
                    "Authentication is required.",
                    "The request requires a valid authenticated API session or bearer token.")
                .ToApiErrorResult();
        }

        var userAuthorizationService = context.HttpContext.RequestServices.GetRequiredService<UserAuthorizationService>();
        var canManageUsers = await userAuthorizationService.CanManageUsersAsync(
            currentUserContext,
            context.HttpContext.RequestAborted);
        if (!canManageUsers)
        {
            return Result.Forbidden(
                    "Access is forbidden.",
                    "You do not have permission to perform this action.")
                .ToApiErrorResult();
        }

        return await next(context);
    }
}
