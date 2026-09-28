using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using OpenSaur.Zentry.Web.Infrastructure.Messaging;
using System.Security.Claims;
using AppHttpResults = OpenSaur.Zentry.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.Zentry.Web.Features.Users.SyncUser;

public static class SyncUserHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        SyncUserRequest request,
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        IUserSyncPublisher userSyncPublisher,
        CancellationToken cancellationToken)
    {
        var workspaceId = ClaimHelper.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return AppHttpResults.BadRequest("Workspace is required.", "User management requires a current workspace.");
        }

        var userExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(candidate => candidate.Id == request.Id && candidate.WorkspaceId == workspaceId.Value, cancellationToken);
        if (!userExists)
        {
            return AppHttpResults.NotFound("User not found.", "No user in the current workspace matched the provided identifier.");
        }

        await userSyncPublisher.PublishUserAsync(request.Id, "ManualSync", cancellationToken);

        return TypedResults.NoContent();
    }
}
