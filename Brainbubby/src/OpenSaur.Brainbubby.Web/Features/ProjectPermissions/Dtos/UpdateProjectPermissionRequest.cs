using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;

public sealed record UpdateProjectPermissionRequest(
    ProjectPermissionType Permission);
