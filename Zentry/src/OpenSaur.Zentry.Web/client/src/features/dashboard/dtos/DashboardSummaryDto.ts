export type DashboardSummaryDto = {
  activeUserCount: number;
  activeWorkspaceCount: number;
  availableRoleCount: number;
  inactiveUserCount: number;
  maxActiveUsers: number | null;
  scope: "global" | "workspace";
  workspaceCount: number;
  workspaceName: string | null;
};
