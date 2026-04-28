using OpenSaur.Zentry.Web.Features.Users.AssignUserRoles;
using OpenSaur.Zentry.Web.Features.Users.CreateUser;
using OpenSaur.Zentry.Web.Features.Users.EditUser;
using OpenSaur.Zentry.Web.Features.Users.GetUserById;
using OpenSaur.Zentry.Web.Features.Users.GetUserRoles;
using OpenSaur.Zentry.Web.Features.Users.GetUsers;
using OpenSaur.Zentry.Web.Features.Users.ResetUserPassword;
using FluentValidation;
using OpenSaur.Zentry.Web.Infrastructure.Auth;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using System.Security.Claims;

namespace OpenSaur.Zentry.Web.Features.Users;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var users = app.MapGroup("/api/user")
            .RequireAuthorization(AppAuthorization.AdminCanManagePolicyName);

        users.MapGet("/get", GetUsersHandler.HandleAsync);
        users.MapGet("/getbyid/{id:guid}", GetUserByIdHandler.HandleAsync);
        users.MapPost("/create", CreateUserHandler.HandleAsync);
        users.MapPut("/edit", EditUserHandler.HandleAsync);
        users.MapPut("/{id:guid}/reset-password", (Guid id, ResetUserPasswordRequest request, ClaimsPrincipal user, ApplicationDbContext dbContext, IValidator<ResetUserPasswordRequest> validator, CancellationToken cancellationToken) =>
            ResetUserPasswordHandler.HandleAsync(request with { Id = id }, user, dbContext, validator, cancellationToken));
        users.MapGet("/{id:guid}/roles", GetUserRolesHandler.HandleAsync);
        users.MapPut("/{id:guid}/roles", (Guid id, AssignUserRolesRequest request, ClaimsPrincipal user, ApplicationDbContext dbContext, CancellationToken cancellationToken) =>
            AssignUserRolesHandler.HandleAsync(request with { Id = id }, user, dbContext, cancellationToken));

        return app;
    }
}
