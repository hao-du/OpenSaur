import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ShieldCheck,
  ShieldUser,
  Users
} from "../../shared/icons";
import type { AuthMeResponse } from "../../features/auth/api/authApi";

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
  label: string;
  path: string;
  requiresImpersonation?: boolean;
  requiresSuperAdministrator?: boolean;
};

export const protectedShellRoutes: ProtectedShellRoute[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/"
  },
  {
    icon: Building2,
    label: "Workspace",
    path: "/workspaces",
    hideWhenImpersonating: true,
    requiresSuperAdministrator: true
  },
  {
    icon: Users,
    label: "Users",
    path: "/users"
  },
  {
    icon: ShieldUser,
    label: "Roles",
    path: "/roles",
    requiresSuperAdministrator: true
  },
  {
    icon: ShieldCheck,
    label: "Role Assignments",
    path: "/role-assignments",
    requiresImpersonation: true,
    requiresSuperAdministrator: true
  }
];

export function isSuperAdministrator(roles: readonly string[]) {
  return roles.some(role => normalizeRoleValue(role) === superAdministratorRole);
}

function matchesProtectedShellRoute(
  route: ProtectedShellRoute,
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

  return true;
}

export function getVisibleProtectedShellRoutes(currentUser: Pick<AuthMeResponse, "isImpersonating" | "roles"> | null | undefined) {
  const roles = currentUser?.roles ?? [];
  const isImpersonating = currentUser?.isImpersonating ?? false;

  return protectedShellRoutes.filter(route => matchesProtectedShellRoute(route, roles, isImpersonating));
}

export function canAccessProtectedShellRoute(
  pathname: string,
  currentUser: Pick<AuthMeResponse, "isImpersonating" | "roles"> | null | undefined
) {
  const route = protectedShellRoutes.find(candidate => candidate.path === pathname);
  if (!route) {
    return true;
  }

  return matchesProtectedShellRoute(route, currentUser?.roles ?? [], currentUser?.isImpersonating ?? false);
}
