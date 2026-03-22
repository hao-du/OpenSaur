namespace OpenSaur.Identity.Web.Features.Users.ChangeUserPassword;

public sealed record ChangeUserPasswordRequest(Guid UserId, string NewPassword);
