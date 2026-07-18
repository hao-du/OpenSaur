using FluentValidation;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using System.Text.Json;

namespace OpenSaur.CashPilot.Web.Features.Templates.Validations;

public sealed class CreateTemplateRequestValidator : AbstractValidator<CreateTemplateRequest>
{
    public CreateTemplateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.TemplateDataJson)
            .NotEmpty()
            .Must(BeValidJsonObject)
            .WithMessage("TemplateDataJson must be a valid JSON object.");
    }

    private static bool BeValidJsonObject(string value)
    {
        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch
        {
            return false;
        }
    }
}

public sealed class UpdateTemplateRequestValidator : AbstractValidator<UpdateTemplateRequest>
{
    public UpdateTemplateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.TemplateDataJson)
            .NotEmpty()
            .Must(BeValidJsonObject)
            .WithMessage("TemplateDataJson must be a valid JSON object.");
    }

    private static bool BeValidJsonObject(string value)
    {
        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch
        {
            return false;
        }
    }
}
