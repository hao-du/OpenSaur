namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;

public sealed record WorkspaceUserCandidateResponse(
    Guid UserId,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    bool AlreadyAssigned);
