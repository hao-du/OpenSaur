using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Persistence;

namespace OpenSaur.Identity.Web.Features.Auth.Login;

public static class LoginHandler
{
    public static async Task<IResult> HandleAsync(
        LoginRequest request,
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.Unauthorized();
        }

        var user = await userManager.FindByNameAsync(request.UserName);
        if (user is null || !user.IsActive)
        {
            return Results.Unauthorized();
        }

        var workspace = await dbContext.Workspaces.FindAsync(user.WorkspaceId);
        if (workspace is null || !workspace.IsActive)
        {
            return Results.Unauthorized();
        }

        var passwordIsValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordIsValid)
        {
            return Results.Unauthorized();
        }

        await signInManager.SignInAsync(user, isPersistent: false);

        return Results.NoContent();
    }
}
