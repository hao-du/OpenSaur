namespace OpenSaur.Identity.Web.Features.Auth.Dashboard;

public sealed record AuthDashboardResponse(
    string Scope,
    string? WorkspaceName,
    int WorkspaceCount,
    int ActiveWorkspaceCount,
    int ActiveUserCount,
    int InactiveUserCount,
    int AvailableRoleCount,
    int? MaxActiveUsers);
