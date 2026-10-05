namespace OpenSaur.Brainbubby.Web.Features.Templates.Dtos;

public sealed record CreateTemplateRequest(
    string Name,
    string? Description,
    string? Content);
