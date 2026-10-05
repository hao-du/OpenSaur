using FluentValidation;
using OpenSaur.Brainbubby.Web.Features.Templates.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.Templates.Validations;

public sealed class UpdateTemplateRequestValidator : AbstractValidator<UpdateTemplateRequest>
{
    public UpdateTemplateRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Template name is required.")
            .MaximumLength(500).WithMessage("Template name cannot exceed 500 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
