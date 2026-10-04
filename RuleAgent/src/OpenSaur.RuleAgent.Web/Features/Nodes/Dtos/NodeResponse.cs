using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

public sealed record NodeResponse(
    Guid Id,
    Guid WorkspaceId,
    Guid? ProjectId,
    string Name,
    NodeType Type,
    string Content,
    string? Description,
    Guid? ParentId,
    bool IsActive,
    DateTime CreatedOn,
    DateTime? UpdatedOn);
