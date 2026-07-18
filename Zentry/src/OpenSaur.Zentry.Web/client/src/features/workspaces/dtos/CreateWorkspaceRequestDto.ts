export type CreateWorkspaceRequestDto = {
  assignedRoleIds: string[];
  description: string;
  maxActiveUsers: number | null;
  name: string;
};
