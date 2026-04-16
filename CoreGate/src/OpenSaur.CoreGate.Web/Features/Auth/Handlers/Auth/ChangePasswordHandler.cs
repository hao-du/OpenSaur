using Microsoft.AspNetCore.Identity;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Infrastructure.Security;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

public class ChangePasswordHandler(
    IHttpContextAccessor httpContextAccessor,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager)
{
    public async Task<ChangePasswordResponse> HandleChangePasswordAsync(ChangePasswordRequest request)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return new ChangePasswordResponse(false, null, "HTTP context is not available.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword)
            || string.IsNullOrWhiteSpace(request.NewPassword)
            || string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return new ChangePasswordResponse(false, null, "Current password, new password, and confirmation are required.");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return new ChangePasswordResponse(false, null, "New password and confirmation do not match.");
        }

        var userId = ClaimPrincipalHelpers.GetUserId(httpContext.User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return new ChangePasswordResponse(false, null, "You must be signed in to change your password.");
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return new ChangePasswordResponse(false, null, "Unable to change password for the current account.");
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errorMessage = result.Errors.FirstOrDefault()?.Description ?? "Password change failed.";
            return new ChangePasswordResponse(false, null, errorMessage);
        }

        if (user.RequirePasswordChange)
        {
            user.RequirePasswordChange = false;
            await userManager.UpdateAsync(user);
        }

        await signInManager.RefreshSignInAsync(user);

        var redirectUri = string.IsNullOrWhiteSpace(request.ReturnUrl) ? "/" : request.ReturnUrl;
        return new ChangePasswordResponse(true, redirectUri, null);
    }
}
