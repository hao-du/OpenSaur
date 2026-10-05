using FluentValidation;
using OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Dtos;

namespace OpenSaur.Brainbubby.Web.Features.ProjectPermissions.Validations;

public sealed class UpdateProjectPermissionRequestValidator : AbstractValidator<UpdateProjectPermissionRequest>
{
    public UpdateProjectPermissionRequestValidator()
    {
        RuleFor(x => x.Permission)
            .IsInEnum().WithMessage("Invalid permission type specified.");
    }
}
