export type RoleAssignmentSummary = {
  description: string;
  id: string;
  isActive: boolean;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
};

export type AssignmentCandidate = {
  email: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
};

export type SaveRoleAssignmentsRequest = {
  assignments: RoleAssignmentSummary[];
  roleId: string;
  selectedUserIds: string[];
};
