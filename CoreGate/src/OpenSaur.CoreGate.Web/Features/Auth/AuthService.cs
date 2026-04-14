using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Features.Auth;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager)
{
    public async Task<LoginResponse> LoginAsync(HttpContext httpContext, LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new LoginResponse(false, null, "Username and password are required.");
        }

        var user = await userManager.FindByNameAsync(request.UserName)
            ?? (request.UserName.Contains('@') ? await userManager.FindByEmailAsync(request.UserName) : null);

        if (user is null || !user.IsActive)
        {
            return new LoginResponse(false, null, "Invalid username or password.");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            return new LoginResponse(false, null, "Invalid username or password.");
        }

        await httpContext.SignInAsync(
            IdentityConstants.ApplicationScheme,
            await signInManager.CreateUserPrincipalAsync(user),
            new AuthenticationProperties
            {
                IsPersistent = false
            });

        var redirectUri = string.IsNullOrWhiteSpace(request.ReturnUrl) ? "/" : request.ReturnUrl;
        return new LoginResponse(true, redirectUri, null);
    }

    public Task LogoutAsync(HttpContext httpContext)
    {
        return httpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
    }
}
