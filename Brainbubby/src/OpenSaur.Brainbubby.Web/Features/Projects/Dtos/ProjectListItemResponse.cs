namespace OpenSaur.Brainbubby.Web.Features.Projects.Dtos;

public sealed record ProjectListItemResponse(
    Guid Id,
    string Name,
    string? Description,
    Guid CreatorId,
    string CreatorName,
    Guid? InstructionTemplateNodeId,
    string? InstructionTemplateName,
    bool IsActive,
    DateTime CreatedOn,
    string CurrentUserRole);
