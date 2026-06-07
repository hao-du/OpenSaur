using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using OpenSaur.CashPilot.Web.Features.Templates.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class CreateTemplateHandler
{
    private static readonly CreateTemplateRequestValidator Validator = new();

    public static async Task<Results<Created<TemplateDetailResponse>, ValidationProblem, Conflict<ProblemDetails>>> HandleAsync(
        CreateTemplateRequest request,
        ClaimsPrincipal user,
        ITagService tagService,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var normalizedName = request.Name.Trim();
        var duplicateNameExists = await dbContext.Templates
            .AnyAsync(candidate => candidate.OwnerId == currentUserId
                && candidate.TemplateType == request.TemplateType
                && candidate.Name == normalizedName, cancellationToken);

        if (duplicateNameExists)
        {
            return AppHttpResults.Conflict("Template name already exists.", "A template with the same type and name already exists.");
        }

        var template = new Template
        {
            OwnerId = currentUserId,
            Name = normalizedName,
            Description = request.Description?.Trim(),
            TemplateType = request.TemplateType,
            TemplateDataJson = request.TemplateDataJson
        };

        await tagService.EnsureTemplateTagDefinitionsExistAsync(currentUserId, request.TemplateDataJson, cancellationToken);

        dbContext.Templates.Add(template);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/templates/{template.Id}", new TemplateDetailResponse(
            template.Id,
            template.Name,
            template.Description,
            template.TemplateType,
            template.TemplateDataJson,
            template.IsActive));
    }
}
