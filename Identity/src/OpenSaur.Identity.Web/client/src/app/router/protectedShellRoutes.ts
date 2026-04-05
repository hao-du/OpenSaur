import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ShieldCheck,
  ShieldUser,
  Users
} from "../../shared/icons";
import type { AuthMeResponse } from "../../features/auth/api/authApi";
import type { TranslationKey } from "../../features/localization/resources";

const superAdministratorRole = "SUPERADMINISTRATOR";

function normalizeRoleValue(role: string) {
  return role
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export type ProtectedShellRoute = {
  hideWhenImpersonating?: boolean;
  icon: LucideIcon;
  labelKey: TranslationKey;
  path: string;
  requiresImpersonation?: boolean;
  requiresSuperAdministrator?: boolean;
  requiresUserManagement?: boolean;
};

export const protectedShellRoutes: ProtectedShellRoute[] = [
  {
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    path: "/"
  },
  {
    icon: Building2,
    labelKey: "nav.workspaces",
    path: "/workspaces",
    hideWhenImpersonating: true,
    requiresSuperAdministrator: true
  },
  {
    icon: Users,
    labelKey: "nav.users",
    path: "/users",
    requiresUserManagement: true
  },
  {
    icon: ShieldUser,
    labelKey: "nav.roles",
    path: "/roles",
    requiresSuperAdministrator: true
  },
  {
    icon: ShieldCheck,
    labelKey: "nav.roleAssignments",
    path: "/role-assignments",
    requiresUserManagement: true
  }
];

export function isSuperAdministrator(roles: readonly string[]) {
  return roles.some(role => normalizeRoleValue(role) === superAdministratorRole);
}

function matchesProtectedShellRoute(
  route: ProtectedShellRoute,
  canManageUsers: boolean,
  roles: readonly string[],
  isImpersonating: boolean
) {
  const userIsSuperAdministrator = isSuperAdministrator(roles);

  if (route.requiresSuperAdministrator && !userIsSuperAdministrator) {
    return false;
  }

  if (route.requiresImpersonation && !isImpersonating) {
    return false;
  }

  if (route.hideWhenImpersonating && isImpersonating) {
    return false;
  }

  if (route.requiresUserManagement && !canManageUsers) {
    return false;
  }

  return true;
}

export function getVisibleProtectedShellRoutes(currentUser: Pick<AuthMeResponse, "canManageUsers" | "isImpersonating" | "roles"> | null | undefined) {
  const canManageUsers = currentUser?.canManageUsers ?? false;
  const roles = currentUser?.roles ?? [];
  const isImpersonating = currentUser?.isImpersonating ?? false;

  return protectedShellRoutes.filter(route => matchesProtectedShellRoute(route, canManageUsers, roles, isImpersonating));
}

export function canAccessProtectedShellRoute(
  pathname: string,
  currentUser: Pick<AuthMeResponse, "canManageUsers" | "isImpersonating" | "roles"> | null | undefined
) {
  const route = protectedShellRoutes.find(candidate => candidate.path === pathname);
  if (!route) {
    return true;
  }

  return matchesProtectedShellRoute(
    route,
    currentUser?.canManageUsers ?? false,
    currentUser?.roles ?? [],
    currentUser?.isImpersonating ?? false
  );
}
