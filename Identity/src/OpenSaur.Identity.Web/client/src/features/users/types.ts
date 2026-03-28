export type UserRoleSummary = {
  assignmentId?: string;
  id: string;
  name: string;
  normalizedName: string;
};

export type UserSummary = {
  email: string;
  id: string;
  isActive: boolean;
  requirePasswordChange: boolean;
  roles?: UserRoleSummary[];
  userName: string;
  workspaceId: string;
};

export type UserDetails = UserSummary & {
  description: string;
  userSettings: string;
};

export type CreateUserRequest = {
  description: string;
  email: string;
  password: string;
  userName: string;
  userSettings: string;
};

export type CreateUserResponse = {
  id: string;
};

export type EditUserRequest = {
  description: string;
  email: string;
  id: string;
  isActive: boolean;
  userName: string;
  userSettings: string;
};

export type UserAssignmentSummary = {
  description: string;
  id: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  roleNormalizedName: string;
  userId: string;
  userName: string;
};

export type RoleCandidateSummary = {
  description: string;
  roleId: string;
  roleName: string;
  roleNormalizedName: string;
};

export type SaveUserAssignmentsRequest = {
  assignments: UserAssignmentSummary[];
  selectedRoleIds: string[];
  userId: string;
};
