using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Users.Dtos;

public sealed record GetManagedUsersRequest(CurrentUserContext CurrentUserContext);

public sealed record GetManagedActiveUsersRequest(CurrentUserContext CurrentUserContext);

public sealed record GetManagedUserByIdRequest(
    Guid UserId,
    CurrentUserContext CurrentUserContext,
    bool TrackChanges = false);

public sealed record GetUserByIdRequest(Guid UserId, bool TrackChanges = false);

public sealed record GetUserByUserNameRequest(string NormalizedUserName, bool TrackChanges = false);

public sealed record GetManagedUsersResponse(IReadOnlyList<ApplicationUser> Users);

public sealed record GetManagedActiveUsersResponse(IReadOnlyList<ApplicationUser> Users);

public sealed record GetManagedUserByIdResponse(ApplicationUser User);

public sealed record GetUserByIdResponse(ApplicationUser User);

public sealed record GetUserByUserNameResponse(ApplicationUser User);
