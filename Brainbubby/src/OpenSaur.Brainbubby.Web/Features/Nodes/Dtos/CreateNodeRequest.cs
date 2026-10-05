using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;

public sealed record CreateNodeRequest(
    string Name,
    NodeType Type,
    Guid? ParentId,
    string? Description,
    string? Content);
