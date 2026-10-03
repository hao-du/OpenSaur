using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;

public sealed record UpdateProjectPermissionRequest(
    ProjectPermissionType Permission);
