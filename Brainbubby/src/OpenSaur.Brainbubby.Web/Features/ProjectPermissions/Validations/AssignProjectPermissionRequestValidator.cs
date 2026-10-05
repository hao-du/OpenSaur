using FluentValidation;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Validations;

public sealed class AssignProjectPermissionRequestValidator : AbstractValidator<AssignProjectPermissionRequest>
{
    public AssignProjectPermissionRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Permission)
            .IsInEnum().WithMessage("Invalid permission type specified.");
    }
}
