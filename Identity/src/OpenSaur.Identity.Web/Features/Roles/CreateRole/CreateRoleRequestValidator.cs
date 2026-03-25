using FluentValidation;

namespace OpenSaur.Identity.Web.Features.Roles.CreateRole;

public sealed class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Role name is required.")
            .MaximumLength(256)
            .WithMessage("Role name must be 256 characters or fewer.");

        RuleFor(request => request.Description)
            .MaximumLength(255)
            .WithMessage("Description must be 255 characters or fewer.");

        RuleFor(request => request.PermissionCodeIds)
            .NotNull()
            .WithMessage("Permission code ids are required.");

        RuleForEach(request => request.PermissionCodeIds)
            .GreaterThan(0)
            .WithMessage("Permission code ids must be positive.");
    }
}
