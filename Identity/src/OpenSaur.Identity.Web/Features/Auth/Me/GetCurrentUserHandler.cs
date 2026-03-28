using System.Security.Claims;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace OpenSaur.Identity.Web.Features.Auth.Me;

public static class GetCurrentUserHandler
{
    public static async Task<IResult> Handle(
        ClaimsPrincipal user,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var roles = user.FindAll(ApplicationClaimTypes.Role)
            .Select(static claim => claim.Value)
            .ToArray();
        var isImpersonating = AuthPrincipalReader.IsImpersonating(user);
        var workspaceName = await ResolveWorkspaceNameAsync(
            user,
            roles,
            dbContext,
            cancellationToken);

        return ApiResponses.Success(
            new AuthMeResponse(
                AuthPrincipalReader.GetUserId(user),
                user.Identity?.Name,
                roles,
                AuthPrincipalReader.GetRequirePasswordChange(user),
                workspaceName,
                isImpersonating));
    }

    private static async Task<string> ResolveWorkspaceNameAsync(
        ClaimsPrincipal user,
        IReadOnlyCollection<string> roles,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (roles.Any(SystemRoles.IsSuperAdministratorValue)
            && !AuthPrincipalReader.IsImpersonating(user))
        {
            return "All workspaces";
        }

        var workspaceId = AuthPrincipalReader.GetWorkspaceId(user);
        if (!workspaceId.HasValue)
        {
            return "Protected workspace";
        }

        return await dbContext.Workspaces
                   .AsNoTracking()
                   .Where(workspace => workspace.Id == workspaceId.Value)
                   .Select(workspace => workspace.Name)
                   .SingleOrDefaultAsync(cancellationToken)
               ?? "Protected workspace";
    }
}
