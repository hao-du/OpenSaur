import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AppProviders } from "../providers/AppProviders";
import * as authApi from "../../features/auth/api/authApi";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { appRoutes } from "./AppRouter";

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn()
  };
});

function setDesktopMode(isDesktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: isDesktop ? query.includes("min-width") : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  });
}

describe("AppRouter", () => {
  function createFutureExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
    window.history.replaceState({}, "", "/");
    setDesktopMode(true);
  });

  function renderRouter(initialEntry: string) {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [initialEntry]
    });

    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    );

    return router;
  }

  it("renders the users placeholder page inside the protected shell", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin"
    });
    renderRouter("/users");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /users/i })).toBeDefined();
    });

    expect(screen.getByText(/coming soon/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /^users$/i }).getAttribute("aria-current")).toBe("page");
  });

  it("redirects non-super-administrators away from the roles route", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-2",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin"
    });
    renderRouter("/roles");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    });

    expect(screen.queryByRole("heading", { level: 1, name: /roles/i })).toBeNull();
  });

  it("renders the workspace placeholder page for super administrators", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-3",
      requirePasswordChange: false,
      roles: ["SuperAdministrator"],
      userName: "systemadministrator"
    });
    renderRouter("/workspaces");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /workspace/i })).toBeDefined();
    });

    expect(screen.getByText(/coming soon/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /^workspace$/i }).getAttribute("aria-current")).toBe("page");
  });
});
