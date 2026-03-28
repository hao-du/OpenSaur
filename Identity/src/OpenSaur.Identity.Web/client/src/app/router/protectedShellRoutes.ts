import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ShieldUser,
  Users
} from "../../shared/icons";

const superAdministratorRole = "SuperAdministrator";

export type ProtectedShellRoute = {
  icon: LucideIcon;
  label: string;
  path: string;
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
  }
];

export function isSuperAdministrator(roles: readonly string[]) {
  return roles.includes(superAdministratorRole);
}

export function getVisibleProtectedShellRoutes(roles: readonly string[]) {
  const userIsSuperAdministrator = isSuperAdministrator(roles);

  return protectedShellRoutes.filter(
    route => !route.requiresSuperAdministrator || userIsSuperAdministrator
  );
}

export function canAccessProtectedShellRoute(pathname: string, roles: readonly string[]) {
  const route = protectedShellRoutes.find(candidate => candidate.path === pathname);
  if (!route) {
    return true;
  }

  return !route.requiresSuperAdministrator || isSuperAdministrator(roles);
}
