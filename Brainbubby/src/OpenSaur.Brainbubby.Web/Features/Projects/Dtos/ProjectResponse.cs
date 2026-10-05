namespace OpenSaur.Brainbubby.Web.Features.Projects.Dtos;

public sealed record ProjectResponse(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string? Description,
    Guid CreatorId,
    string CreatorName,
    Guid? InstructionTemplateNodeId,
    string? InstructionTemplateName,
    bool IsActive,
    DateTime CreatedOn,
    DateTime? UpdatedOn,
    string CurrentUserRole);
