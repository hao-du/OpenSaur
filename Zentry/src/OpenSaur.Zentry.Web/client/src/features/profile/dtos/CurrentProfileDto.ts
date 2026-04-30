export type CurrentProfileDto = {
  canAssignUsers: boolean;
  canEditRoles: boolean;
  email: string;
  firstName: string;
  isImpersonating: boolean;
  isSuperAdministrator: boolean;
  lastName: string;
  navigationItems: CurrentProfileNavigationItemDto[];
  roles: string[];
  userName: string;
  workspaceName: string;
};

export type CurrentProfileNavigationItemDto = {
  icon: string;
  label: string;
  path: string;
};
