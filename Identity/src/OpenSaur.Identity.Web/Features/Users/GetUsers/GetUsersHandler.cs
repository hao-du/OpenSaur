using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users.GetUsers;

public static class GetUsersHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        CancellationToken cancellationToken)
    {
        var usersResult = await userRepository.GetManagedUsersAsync(
            new GetManagedUsersRequest(currentUserContext),
            cancellationToken);

        return usersResult.ToApiResult(
            users => users.Users.Select(
                static user => new GetUsersResponse(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.WorkspaceId,
                user.IsActive,
                user.RequirePasswordChange))
                .ToList());
    }
}
