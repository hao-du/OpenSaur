namespace OpenSaur.Brainbubby.Web.Features.Templates.Dtos;

public sealed record UpdateTemplateRequest(
    string Name,
    string? Description,
    string? Content);
