using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;

public sealed record ProjectMemberResponse(
    Guid Id,
    Guid ProjectId,
    Guid UserId,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    ProjectPermissionType Permission,
    bool IsCreator,
    bool IsActive,
    DateTime CreatedOn,
    DateTime? UpdatedOn);
