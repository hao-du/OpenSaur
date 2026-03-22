using OpenSaur.Identity.Web.Features.Users.ChangeUserPassword;
using OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;
using OpenSaur.Identity.Web.Features.Users.CreateUser;
using OpenSaur.Identity.Web.Features.Users.EditUser;
using OpenSaur.Identity.Web.Features.Users.GetUserById;
using OpenSaur.Identity.Web.Features.Users.GetUsers;
using OpenSaur.Identity.Web.Infrastructure.Authorization;
using OpenSaur.Identity.Web.Infrastructure;
using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Features.Users;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var users = app.MapGroup("/api/user")
            .RequireAuthorization(AuthorizationPolicies.Api)
            .RequirePermission(PermissionCode.Administrator_CanManage)
            .RequireWorkspaceAccess();

        users.MapGet("/get", GetUsersHandler.HandleAsync);
        users.MapGet("/getbyid/{id:guid}", GetUserByIdHandler.HandleAsync);
        users.MapPost("/create", CreateUserHandler.HandleAsync);
        users.MapPut("/edit", EditUserHandler.HandleAsync);
        users.MapPut("/changepassword", ChangeUserPasswordHandler.HandleAsync);
        users.MapPut("/change-workspace", ChangeUserWorkspaceHandler.HandleAsync)
            .RequireWorkspaceAccess(restrictToSuperAdministrator: true);

        return app;
    }
}
