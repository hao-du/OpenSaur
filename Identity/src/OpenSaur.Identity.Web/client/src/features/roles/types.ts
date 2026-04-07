export type RoleSummary = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  normalizedName: string;
};

export type RoleDetails = RoleSummary & {
  permissionCodes: string[];
};

export type PermissionSummary = {
  code: string;
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
  permissionCodes: string[];
};

export type CreateRoleResponse = {
  id: string;
};

export type EditRoleRequest = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  permissionCodes: string[];
};
