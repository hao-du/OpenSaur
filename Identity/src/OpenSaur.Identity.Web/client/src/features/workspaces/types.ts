export type WorkspaceSummary = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
};

export type WorkspaceDetails = WorkspaceSummary;

export type CreateWorkspaceRequest = {
  description: string;
  name: string;
};

export type CreateWorkspaceResponse = {
  id: string;
};

export type EditWorkspaceRequest = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
};
