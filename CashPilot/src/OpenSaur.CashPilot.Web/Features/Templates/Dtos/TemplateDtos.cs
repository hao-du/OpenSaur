using OpenSaur.CashPilot.Web.Domain;

namespace OpenSaur.CashPilot.Web.Features.Templates.Dtos;

public sealed record TemplateListItemResponse(
    Guid Id,
    string Name,
    string? Description,
    TemplateType TemplateType,
    bool IsActive);

public sealed record TemplateDetailResponse(
    Guid Id,
    string Name,
    string? Description,
    TemplateType TemplateType,
    string TemplateDataJson,
    bool IsActive);

public sealed record CreateTemplateRequest(
    string Name,
    string? Description,
    TemplateType TemplateType,
    string TemplateDataJson);

public sealed record UpdateTemplateRequest(
    string Name,
    string? Description,
    TemplateType TemplateType,
    string TemplateDataJson,
    bool IsActive);
