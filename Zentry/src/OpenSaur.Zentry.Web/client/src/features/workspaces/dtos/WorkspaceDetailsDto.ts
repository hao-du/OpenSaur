export type WorkspaceDetailsDto = {
  assignedRoleIds: string[];
  description: string;
  id: string;
  isActive: boolean;
  maxActiveUsers: number | null;
  name: string;
};
