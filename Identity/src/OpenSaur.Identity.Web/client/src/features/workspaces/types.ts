export type WorkspaceSummary = {
  assignedRoleIds?: string[];
  description: string;
  id: string;
  isActive: boolean;
  name: string;
};

export type WorkspaceDetails = WorkspaceSummary & {
  assignedRoleIds: string[];
};

export type CreateWorkspaceRequest = {
  assignedRoleIds: string[];
  description: string;
  name: string;
};

export type CreateWorkspaceResponse = {
  id: string;
};

export type EditWorkspaceRequest = {
  assignedRoleIds: string[];
  description: string;
  id: string;
  isActive: boolean;
  name: string;
};
