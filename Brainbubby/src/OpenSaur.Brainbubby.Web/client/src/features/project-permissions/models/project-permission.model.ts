export type ProjectPermissionType = 'CanView' | 'CanEdit';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  permission: ProjectPermissionType;
  isCreator: boolean;
  isActive: boolean;
  createdOn: string;
  updatedOn?: string | null;
}

export interface WorkspaceUserCandidate {
  userId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  alreadyAssigned: boolean;
}

export interface AssignProjectPermissionRequest {
  userId: string;
  permission: ProjectPermissionType;
}

export interface UpdateProjectPermissionRequest {
  permission: ProjectPermissionType;
}
