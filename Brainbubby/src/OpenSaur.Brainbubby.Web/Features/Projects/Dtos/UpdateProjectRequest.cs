namespace OpenSaur.Brainbubby.Web.Features.Projects.Dtos;

public sealed record UpdateProjectRequest(
    string Name,
    string? Description,
    Guid? InstructionTemplateNodeId);
