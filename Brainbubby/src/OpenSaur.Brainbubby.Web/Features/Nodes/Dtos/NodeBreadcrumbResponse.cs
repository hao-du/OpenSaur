using OpenSaur.Brainbubby.Web.Domain;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;

public sealed record NodeBreadcrumbResponse(
    Guid Id,
    string Name,
    NodeType Type,
    int Depth);
