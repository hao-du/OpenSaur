using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using OpenSaur.CashPilot.Web.Features.Templates.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class UpdateTemplateHandler
{
    private static readonly UpdateTemplateRequestValidator Validator = new();

    public static async Task<Results<Ok<TemplateDetailResponse>, NotFound, ValidationProblem, Conflict<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateTemplateRequest request,
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

        var template = await dbContext.Templates
            .SingleOrDefaultAsync(candidate => candidate.OwnerId == currentUserId && candidate.Id == id, cancellationToken);

        if (template is null)
        {
            return TypedResults.NotFound();
        }

        var normalizedName = request.Name.Trim();
        var duplicateNameExists = await dbContext.Templates
            .AnyAsync(candidate => candidate.OwnerId == currentUserId
                && candidate.Id != id
                && candidate.TemplateType == request.TemplateType
                && candidate.Name == normalizedName, cancellationToken);

        if (duplicateNameExists)
        {
            return AppHttpResults.Conflict("Template name already exists.", "A template with the same type and name already exists.");
        }

        template.Name = normalizedName;
        template.Description = request.Description?.Trim();
        template.TemplateType = request.TemplateType;
        template.TemplateDataJson = request.TemplateDataJson;
        template.IsActive = request.IsActive;

        await tagService.EnsureTemplateTagDefinitionsExistAsync(currentUserId, request.TemplateDataJson, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new TemplateDetailResponse(
            template.Id,
            template.Name,
            template.Description,
            template.TemplateType,
            template.TemplateDataJson,
            template.IsActive));
    }
}
