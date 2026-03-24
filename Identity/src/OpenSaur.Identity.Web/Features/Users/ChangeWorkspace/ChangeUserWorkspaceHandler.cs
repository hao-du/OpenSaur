using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Features.Users.ChangeWorkspace;

public static class ChangeUserWorkspaceHandler
{
    public static async Task<IResult> HandleAsync(
        ChangeUserWorkspaceRequest request,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
        {
            return Results.NotFound();
        }

        var workspace = await dbContext.Workspaces
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == request.WorkspaceId, cancellationToken);
        if (workspace is null || !workspace.IsActive)
        {
            return Results.ValidationProblem(UserValidationProblems.ForWorkspace());
        }

        user.WorkspaceId = request.WorkspaceId;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Results.ValidationProblem(UserValidationProblems.FromIdentityErrors(updateResult.Errors));
        }

        return Results.NoContent();
    }
}
