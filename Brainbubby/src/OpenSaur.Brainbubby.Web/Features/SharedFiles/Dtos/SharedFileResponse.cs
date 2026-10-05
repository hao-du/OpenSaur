namespace OpenSaur.Brainbubby.Web.Features.SharedFiles.Dtos;

public sealed record SharedFileResponse(
    Guid FileNodeId,
    Guid OwningProjectId,
    string OwningProjectName,
    string Name,
    string? Description,
    string Content,
    DateTime CreatedOn,
    DateTime? UpdatedOn,
    DateTime SharedOn,
    Guid SharedBy);
