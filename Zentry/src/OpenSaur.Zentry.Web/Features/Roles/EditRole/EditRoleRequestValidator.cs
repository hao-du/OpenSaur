using FluentValidation;

namespace OpenSaur.Zentry.Web.Features.Roles.EditRole;

public sealed class EditRoleRequestValidator : AbstractValidator<EditRoleRequest>
{
    public EditRoleRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("Role id is required.");

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Role name is required.")
            .MaximumLength(256)
            .WithMessage("Role name must be 256 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.PermissionCodes)
            .NotNull()
            .WithMessage("Permission codes are required.");

        RuleForEach(request => request.PermissionCodes)
            .NotEmpty()
            .WithMessage("Permission codes are required.");
    }
}
