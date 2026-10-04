using FluentValidation;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Dtos;

namespace OpenSaur.RuleAgent.Web.Features.Snapshots.Validations;

public sealed class CreateSnapshotRequestValidator : AbstractValidator<CreateSnapshotRequest>
{
    public CreateSnapshotRequestValidator()
    {
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
