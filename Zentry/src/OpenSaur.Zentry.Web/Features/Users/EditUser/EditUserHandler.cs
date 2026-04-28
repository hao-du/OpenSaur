using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Features.Users.CreateUser;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.EditUser;

public static class EditUserHandler
{
    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        EditUserRequest request,
        IValidator<EditUserRequest> validator,
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

        var targetUser = await dbContext.Users
            .SingleOrDefaultAsync(candidate => candidate.Id == request.Id && candidate.WorkspaceId == workspaceId.Value, cancellationToken);
        if (targetUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
        }

        var normalizedUserName = CreateUserHandler.NormalizeIdentityValue(request.UserName);
        var duplicateUserNameExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(candidate => candidate.Id != request.Id && candidate.NormalizedUserName == normalizedUserName, cancellationToken);
        if (duplicateUserNameExists)
        {
            return AppHttpResults.Conflict("User name already exists.", "A user with this user name already exists.");
        }

        targetUser.UserName = request.UserName.Trim();
        targetUser.NormalizedUserName = normalizedUserName;
        targetUser.Email = request.Email.Trim();
        targetUser.NormalizedEmail = CreateUserHandler.NormalizeIdentityValue(request.Email);
        targetUser.FirstName = request.FirstName.Trim();
        targetUser.LastName = request.LastName.Trim();
        targetUser.Description = request.Description;
        targetUser.IsActive = request.IsActive;
        targetUser.RequirePasswordChange = request.RequirePasswordChange;
        targetUser.UpdatedBy = ClaimHelper.GetCurrentUserId(user);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
