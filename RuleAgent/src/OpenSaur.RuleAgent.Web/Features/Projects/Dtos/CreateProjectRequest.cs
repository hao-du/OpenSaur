namespace OpenSaur.RuleAgent.Web.Features.Projects.Dtos;

public sealed record CreateProjectRequest(
    string Name,
    string? Description,
    Guid? InstructionTemplateNodeId);
