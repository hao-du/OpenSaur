namespace OpenSaur.Zentry.Web.Features.Dashboard.GetDashboardSummary;

public sealed record DashboardSummaryResponse(
    string Scope,
    string? WorkspaceName,
    int WorkspaceCount,
    int ActiveWorkspaceCount,
    int ActiveUserCount,
    int InactiveUserCount,
    int AvailableRoleCount,
    int? MaxActiveUsers);
