using Microsoft.AspNetCore.Identity;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

public class ChangePasswordAccessHandler(
    IHttpContextAccessor httpContextAccessor,
    UserManager<ApplicationUser> userManager)
{
    public async Task<bool> HandleAccessChangePasswordAsync()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return false;
        }

        var userId = ClaimPrincipalHelpers.GetUserId(httpContext.User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return false;
        }

        var user = await userManager.FindByIdAsync(userId);
        return user is not null && user.IsActive && user.RequirePasswordChange;
    }
}
