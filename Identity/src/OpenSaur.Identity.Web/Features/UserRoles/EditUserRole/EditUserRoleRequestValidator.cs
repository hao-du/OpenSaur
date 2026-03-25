using FluentValidation;

namespace OpenSaur.Identity.Web.Features.UserRoles.EditUserRole;

public sealed class EditUserRoleRequestValidator : AbstractValidator<EditUserRoleRequest>
{
    public EditUserRoleRequestValidator()
    {
        RuleFor(request => request.Id)
            .NotEmpty()
            .WithMessage("User-role assignment id is required.");

        RuleFor(request => request.RoleId)
            .NotEmpty()
            .WithMessage("Role id is required.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");
    }
}
