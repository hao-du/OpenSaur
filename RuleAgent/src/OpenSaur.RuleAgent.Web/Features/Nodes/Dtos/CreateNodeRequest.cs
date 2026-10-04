using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

public sealed record CreateNodeRequest(
    string Name,
    NodeType Type,
    Guid? ParentId,
    string? Description,
    string? Content);
