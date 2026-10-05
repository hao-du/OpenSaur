namespace OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;

public sealed record UpdateNodeRequest(
    string Name,
    string? Description);
