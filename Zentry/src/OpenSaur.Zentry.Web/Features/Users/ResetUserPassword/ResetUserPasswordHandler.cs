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

namespace OpenSaur.Zentry.Web.Features.Users.ResetUserPassword;

public static class ResetUserPasswordHandler
{
    public static async Task<Results<NoContent, ValidationProblem, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        ResetUserPasswordRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IValidator<ResetUserPasswordRequest> validator,
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

        targetUser.PasswordHash = new PasswordHasher<ApplicationUser>().HashPassword(targetUser, request.Password);
        targetUser.RequirePasswordChange = true;
        targetUser.SecurityStamp = Guid.NewGuid().ToString();
        targetUser.UpdatedBy = ClaimHelper.GetCurrentUserId(user);

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
