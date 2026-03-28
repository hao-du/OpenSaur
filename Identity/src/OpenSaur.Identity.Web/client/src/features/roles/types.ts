export type RoleSummary = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  normalizedName: string;
};

export type RoleDetails = RoleSummary & {
  permissionCodeIds: number[];
};

export type PermissionSummary = {
  code: string;
  codeId: number;
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  permissionScopeId: string;
  permissionScopeName: string;
};

export type CreateRoleRequest = {
  description: string;
  name: string;
  permissionCodeIds: number[];
};

export type CreateRoleResponse = {
  id: string;
};

export type EditRoleRequest = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  permissionCodeIds: number[];
};
