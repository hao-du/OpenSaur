export type UserRoleDto = {
  description: string;
  isAssigned: boolean;
  name: string;
  roleId: string;
};

export type UserRolesDto = {
  roles: UserRoleDto[];
  userId: string;
  userName: string;
};
