import type { RoleSummaryDto } from "./RoleSummaryDto";

export type RoleDetailsDto = RoleSummaryDto & {
  permissionCodes: string[];
};
