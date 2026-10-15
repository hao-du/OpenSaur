export interface CurrentProfileDto {
  id: string;
  workspaceId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  isSuperAdministrator: boolean;
  roles: string[];
  permissions: string[];
}
