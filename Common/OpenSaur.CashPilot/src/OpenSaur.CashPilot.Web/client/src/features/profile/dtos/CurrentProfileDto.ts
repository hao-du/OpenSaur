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
  requirePasswordChange: boolean;
  navigationItems: NavigationItemDto[];
};
