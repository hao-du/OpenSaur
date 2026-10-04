namespace OpenSaur.RuleAgent.Web.Features.Templates.Dtos;

public sealed record TemplateResponse(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string? Description,
    string Content,
    bool IsActive,
    DateTime CreatedOn,
    DateTime? UpdatedOn);
