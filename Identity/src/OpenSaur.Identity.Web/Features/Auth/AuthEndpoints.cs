using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure;
using OpenSaur.Identity.Web.Infrastructure.Persistence;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapPost(
            "/login",
            async Task<IResult> (
                LoginRequest request,
                ApplicationDbContext dbContext,
                UserManager<ApplicationUser> userManager,
                FirstPartyJwtTokenService jwtTokenService,
                FirstPartyRefreshTokenService refreshTokenService,
                HttpContext httpContext) =>
            {
                var user = await userManager.FindByNameAsync(request.UserName);
                if (user is null)
                {
                    return Results.Unauthorized();
                }

                if (!user.IsActive)
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

                var roles = await userManager.GetRolesAsync(user);
                var accessToken = jwtTokenService.CreateToken(user, roles);
                await refreshTokenService.IssueAsync(httpContext, user);

                return Results.Ok(ToAuthResponse(user, roles, accessToken));
            });

        auth.MapPost(
            "/change-password",
            async Task<IResult>(
                ChangePasswordRequest request,
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager,
                FirstPartyJwtTokenService jwtTokenService,
                FirstPartyRefreshTokenService refreshTokenService,
                HttpContext httpContext) =>
            {
                var userId = GetUserId(principal);
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Results.Unauthorized();
                }

                var user = await userManager.FindByIdAsync(userId);
                if (user is null || !user.IsActive)
                {
                    return Results.Unauthorized();
                }

                var changePasswordResult = await userManager.ChangePasswordAsync(
                    user,
                    request.CurrentPassword,
                    request.NewPassword);
                if (!changePasswordResult.Succeeded)
                {
                    return Results.ValidationProblem(
                        changePasswordResult.Errors
                            .GroupBy(static error => error.Code)
                            .ToDictionary(
                                group => group.Key,
                                group => group.Select(static error => error.Description).ToArray()));
                }

                if (user.RequirePasswordChange)
                {
                    user.RequirePasswordChange = false;
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        return Results.ValidationProblem(
                            updateResult.Errors
                                .GroupBy(static error => error.Code)
                                .ToDictionary(
                                    group => group.Key,
                                    group => group.Select(static error => error.Description).ToArray()));
                    }
                }

                var roles = await userManager.GetRolesAsync(user);
                var accessToken = jwtTokenService.CreateToken(user, roles);
                await refreshTokenService.IssueAsync(httpContext, user);

                return Results.Ok(ToAuthResponse(user, roles, accessToken));
            })
            .RequireAuthorization(AuthorizationPolicies.Api);

        auth.MapPost(
            "/refresh",
            async Task<IResult> (
                ApplicationDbContext dbContext,
                UserManager<ApplicationUser> userManager,
                FirstPartyJwtTokenService jwtTokenService,
                FirstPartyRefreshTokenService refreshTokenService,
                HttpContext httpContext) =>
            {
                var validationResult = await refreshTokenService.ValidateAsync(httpContext);
                if (!validationResult.IsValid)
                {
                    return Results.Unauthorized();
                }

                var user = validationResult.User!;
                if (!user.IsActive)
                {
                    await refreshTokenService.ClearAsync(httpContext, user);
                    return Results.Unauthorized();
                }

                var workspace = await dbContext.Workspaces.FindAsync(user.WorkspaceId);
                if (workspace is null || !workspace.IsActive)
                {
                    await refreshTokenService.ClearAsync(httpContext, user);
                    return Results.Unauthorized();
                }

                var roles = await userManager.GetRolesAsync(user);
                var accessToken = jwtTokenService.CreateToken(user, roles);
                await refreshTokenService.IssueAsync(httpContext, user);

                return Results.Ok(ToAuthResponse(user, roles, accessToken));
            });

        auth.MapPost(
            "/logout",
            async Task<IResult> (
                ClaimsPrincipal principal,
                UserManager<ApplicationUser> userManager,
                FirstPartyRefreshTokenService refreshTokenService,
                HttpContext httpContext) =>
            {
                ApplicationUser? user = null;
                var userId = GetUserId(principal);
                if (!string.IsNullOrWhiteSpace(userId))
                {
                    user = await userManager.FindByIdAsync(userId);
                }

                if (user is null)
                {
                    var validationResult = await refreshTokenService.ValidateAsync(httpContext);
                    user = validationResult.User;
                }

                await refreshTokenService.ClearAsync(httpContext, user);

                return Results.Ok();
            })
            .AllowAnonymous();

        auth.MapGet("/me", (ClaimsPrincipal user) =>
            Results.Ok(new
            {
                Id = GetUserId(user),
                UserName = user.Identity?.Name,
                RequirePasswordChange = GetRequirePasswordChange(user),
                Roles = user.FindAll(ApplicationClaimTypes.Role).Select(static claim => claim.Value).ToArray()
            }))
            .RequireAuthorization(AuthorizationPolicies.Api);

        return app;
    }

    private static AuthResponse ToAuthResponse(
        ApplicationUser user,
        IEnumerable<string> roles,
        AccessTokenResult accessToken)
    {
        return new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            new AuthUser(
                user.Id.ToString(),
                user.UserName ?? string.Empty,
                roles.ToArray(),
                user.RequirePasswordChange));
    }

    private static string? GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ApplicationClaimTypes.Subject)
               ?? principal.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
    }

    private static bool GetRequirePasswordChange(ClaimsPrincipal principal)
    {
        return bool.TryParse(principal.FindFirstValue(ApplicationClaimTypes.RequirePasswordChange), out var requirePasswordChange)
            && requirePasswordChange;
    }
}

public sealed record LoginRequest(string UserName, string Password);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, AuthUser User);

public sealed record AuthUser(string Id, string UserName, string[] Roles, bool RequirePasswordChange);
