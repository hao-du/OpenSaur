export type RoleUsersDto = {
  roleId: string;
  roleName: string;
  users: RoleUserDto[];
};

export type RoleUserDto = {
  email: string;
  firstName: string;
  isAssigned: boolean;
  lastName: string;
  userId: string;
  userName: string;
};
