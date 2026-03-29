import { describe, expect, it } from "vitest";
import {
  canAccessProtectedShellRoute,
  getVisibleProtectedShellRoutes,
  isSuperAdministrator
} from "./protectedShellRoutes";

describe("protectedShellRoutes", () => {
  it("treats legacy SuperAdministrator role values as super administrator access", () => {
    expect(isSuperAdministrator(["SuperAdministrator"])).toBe(true);

    const routes = getVisibleProtectedShellRoutes({
      isImpersonating: false,
      roles: ["SuperAdministrator"]
    });

    expect(routes.some(route => route.path === "/workspaces")).toBe(true);
    expect(routes.some(route => route.path === "/roles")).toBe(true);
    expect(canAccessProtectedShellRoute("/workspaces", {
      isImpersonating: false,
      roles: ["SuperAdministrator"]
    })).toBe(true);
  });

  it("treats spaced normalized super administrator role values as super administrator access", () => {
    expect(isSuperAdministrator(["SUPER ADMINISTRATOR"])).toBe(true);

    const routes = getVisibleProtectedShellRoutes({
      canManageUsers: false,
      isImpersonating: false,
      roles: ["SUPER ADMINISTRATOR"]
    });

    expect(routes.some(route => route.path === "/workspaces")).toBe(true);
    expect(routes.some(route => route.path === "/roles")).toBe(true);
    expect(canAccessProtectedShellRoute("/workspaces", {
      canManageUsers: false,
      isImpersonating: false,
      roles: ["SUPER ADMINISTRATOR"]
    })).toBe(true);
  });

  it("hides users when the session cannot manage users", () => {
    const routes = getVisibleProtectedShellRoutes({
      canManageUsers: false,
      isImpersonating: false,
      roles: ["SUPERADMINISTRATOR"]
    } as any);

    expect(routes.some(route => route.path === "/users")).toBe(false);
    expect(canAccessProtectedShellRoute("/users", {
      canManageUsers: false,
      isImpersonating: false,
      roles: ["SUPERADMINISTRATOR"]
    } as any)).toBe(false);
  });

  it("shows users when the session can manage users inside a workspace", () => {
    const routes = getVisibleProtectedShellRoutes({
      canManageUsers: true,
      isImpersonating: false,
      roles: ["ADMINISTRATOR"]
    } as any);

    expect(routes.some(route => route.path === "/users")).toBe(true);
    expect(canAccessProtectedShellRoute("/users", {
      canManageUsers: true,
      isImpersonating: false,
      roles: ["ADMINISTRATOR"]
    } as any)).toBe(true);
    expect(routes.some(route => route.path === "/role-assignments")).toBe(true);
    expect(canAccessProtectedShellRoute("/role-assignments", {
      canManageUsers: true,
      isImpersonating: false,
      roles: ["ADMINISTRATOR"]
    } as any)).toBe(true);
  });
});
