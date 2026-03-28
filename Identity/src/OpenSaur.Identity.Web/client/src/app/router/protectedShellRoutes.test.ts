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
      isImpersonating: false,
      roles: ["SUPER ADMINISTRATOR"]
    });

    expect(routes.some(route => route.path === "/workspaces")).toBe(true);
    expect(routes.some(route => route.path === "/roles")).toBe(true);
    expect(canAccessProtectedShellRoute("/workspaces", {
      isImpersonating: false,
      roles: ["SUPER ADMINISTRATOR"]
    })).toBe(true);
  });
});
