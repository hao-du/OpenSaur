using FluentValidation;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Dtos;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Validations;

public sealed class UpdateNodeContentRequestValidator : AbstractValidator<UpdateNodeContentRequest>
{
    public UpdateNodeContentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotNull().WithMessage("Content must not be null.");
    }
}
