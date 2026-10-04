using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

public sealed record NodeBreadcrumbResponse(
    Guid Id,
    string Name,
    NodeType Type,
    int Depth);
