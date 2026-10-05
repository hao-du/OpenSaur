using FluentValidation;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.Snapshots.Validations;

public sealed class CreateSnapshotRequestValidator : AbstractValidator<CreateSnapshotRequest>
{
    public CreateSnapshotRequestValidator()
    {
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
