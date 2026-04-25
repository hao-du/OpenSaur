export type EditRoleRequestDto = {
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  permissionCodes: string[];
};
