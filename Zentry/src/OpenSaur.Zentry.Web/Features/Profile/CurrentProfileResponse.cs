namespace OpenSaur.Zentry.Web.Features.Profile;

public sealed record CurrentProfileResponse(
    string FirstName,
    string LastName,
    string WorkspaceName,
    bool IsImpersonating);
