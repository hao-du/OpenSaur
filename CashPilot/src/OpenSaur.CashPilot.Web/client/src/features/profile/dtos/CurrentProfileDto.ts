export type NavigationItemDto = {
  icon: string;
  label: string;
  path: string;
};

export type CurrentProfileDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  workspaceName?: string;
  isImpersonating?: boolean;
  isSuperAdministrator?: boolean;
  canManage?: boolean;
  roles?: string[];
  navigationItems: NavigationItemDto[];
};
