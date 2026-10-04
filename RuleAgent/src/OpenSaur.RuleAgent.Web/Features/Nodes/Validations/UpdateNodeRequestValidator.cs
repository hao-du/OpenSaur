using FluentValidation;
using OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;

namespace OpenSaur.RuleAgent.Web.Features.Nodes.Validations;

public sealed class UpdateNodeRequestValidator : AbstractValidator<UpdateNodeRequest>
{
    public UpdateNodeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Node name is required.")
            .MaximumLength(500).WithMessage("Node name cannot exceed 500 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
