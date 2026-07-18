using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Domain.Identity;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.CreateUser;

public static class CreateUserHandler
{
    public static async Task<Results<Ok<CreateUserResponse>, ValidationProblem, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateUserRequest request,
        IValidator<CreateUserRequest> validator,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User management requires a current workspace.");
        }

        var normalizedUserName = NormalizeIdentityValue(request.UserName);
        var duplicateUserNameExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(candidate => candidate.NormalizedUserName == normalizedUserName, cancellationToken);
        if (duplicateUserNameExists)
        {
            return AppHttpResults.Conflict("User name already exists.", "A user with this user name already exists.");
        }

        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var targetUser = new ApplicationUser
        {
            Id = Guid.CreateVersion7(),
            UserName = request.UserName.Trim(),
            NormalizedUserName = normalizedUserName,
            Email = request.Email.Trim(),
            NormalizedEmail = NormalizeIdentityValue(request.Email),
            EmailConfirmed = true,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Description = request.Description,
            IsActive = true,
            RequirePasswordChange = request.RequirePasswordChange,
            WorkspaceId = workspaceId.Value,
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
            CreatedBy = currentUserId
        };
        targetUser.PasswordHash = new PasswordHasher<ApplicationUser>().HashPassword(targetUser, request.Password);

        dbContext.Users.Add(targetUser);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new CreateUserResponse(targetUser.Id));
    }

    internal static string NormalizeIdentityValue(string value)
    {
        return value.Trim().ToUpperInvariant();
    }
}
