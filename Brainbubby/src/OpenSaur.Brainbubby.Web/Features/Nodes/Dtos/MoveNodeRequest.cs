namespace OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;

public sealed record MoveNodeRequest(
    Guid? NewParentId);
