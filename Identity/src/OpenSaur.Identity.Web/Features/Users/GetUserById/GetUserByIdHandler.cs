using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Users.GetUserById;

public static class GetUserByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        CancellationToken cancellationToken)
    {
        var userResult = await userRepository.GetManagedUserByIdAsync(
            new GetManagedUserByIdRequest(id, currentUserContext),
            cancellationToken);

        return userResult.ToApiResult(
            response => new GetUserByIdResponse(
                response.User.Id,
                response.User.UserName ?? string.Empty,
                response.User.Email ?? string.Empty,
                response.User.WorkspaceId,
                response.User.Description,
                response.User.IsActive,
                response.User.RequirePasswordChange,
                response.User.UserSettings,
                response.User.FirstName,
                response.User.LastName));
    }
}
