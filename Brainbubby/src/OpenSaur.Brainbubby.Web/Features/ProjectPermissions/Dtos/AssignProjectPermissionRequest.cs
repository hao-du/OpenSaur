using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;

public sealed record AssignProjectPermissionRequest(
    Guid UserId,
    ProjectPermissionType Permission);
