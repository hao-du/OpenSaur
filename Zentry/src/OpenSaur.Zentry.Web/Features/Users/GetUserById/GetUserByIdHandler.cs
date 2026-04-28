using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.GetUserById;

public static class GetUserByIdHandler
{
    public static async Task<Results<Ok<GetUserByIdResponse>, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User management requires a current workspace.");
        }

        var targetUser = await dbContext.Users
            .AsNoTracking()
            .Where(candidate => candidate.Id == id && candidate.WorkspaceId == workspaceId.Value)
            .Select(candidate => new GetUserByIdResponse(
                candidate.Id,
                candidate.UserName ?? string.Empty,
                candidate.Email ?? string.Empty,
                candidate.FirstName,
                candidate.LastName,
                candidate.Description,
                candidate.IsActive,
                candidate.RequirePasswordChange))
            .SingleOrDefaultAsync(cancellationToken);

        if (targetUser is null)
        {
            return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
        }

        return TypedResults.Ok(targetUser);
    }
}
