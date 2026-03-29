using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth.Settings;

public static class GetCurrentUserSettingsHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext currentUserContext,
        UserRepository userRepository,
        CancellationToken cancellationToken)
    {
        var userResult = await userRepository.GetUserByIdAsync(
            new GetUserByIdRequest(currentUserContext.UserId),
            cancellationToken);

        return userResult.ToApiResult(
            response => CurrentUserSettingsJson.Read(response.User.UserSettings));
    }
}
