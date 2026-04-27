export type CurrentProfileDto = {
  canAssignUsers: boolean;
  canEditRoles: boolean;
  firstName: string;
  isImpersonating: boolean;
  isSuperAdministrator: boolean;
  lastName: string;
  navigationItems: CurrentProfileNavigationItemDto[];
  workspaceName: string;
};

export type CurrentProfileNavigationItemDto = {
  icon: string;
  label: string;
  path: string;
};
