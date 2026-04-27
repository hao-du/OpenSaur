export type RoleUsersDto = {
  roleId: string;
  roleName: string;
  users: RoleUserDto[];
};

export type RoleUserDto = {
  email: string;
  isAssigned: boolean;
  userId: string;
  userName: string;
};
