using FluentValidation;

namespace OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole;

public sealed class CreateUserRoleRequestValidator : AbstractValidator<CreateUserRoleRequest>
{
    public CreateUserRoleRequestValidator()
    {
        RuleFor(request => request.UserId)
            .NotEmpty()
            .WithMessage("User id is required.");

        RuleFor(request => request.RoleId)
            .NotEmpty()
            .WithMessage("Role id is required.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");
    }
}
