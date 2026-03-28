namespace OpenSaur.Identity.Web.Features.Auth.Me;

public sealed record AuthMeResponse(
    string? Id,
    string? UserName,
    string[] Roles,
    bool RequirePasswordChange,
    string WorkspaceName,
    bool IsImpersonating,
    bool CanManageUsers);
