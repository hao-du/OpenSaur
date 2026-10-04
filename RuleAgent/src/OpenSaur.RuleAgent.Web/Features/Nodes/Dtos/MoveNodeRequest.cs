namespace OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

public sealed record MoveNodeRequest(
    Guid? NewParentId);
