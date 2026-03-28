import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import * as authApi from "../../features/auth/api/authApi";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { ProtectedShellTemplate } from "./ProtectedShellTemplate";

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    logout: vi.fn()
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

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

describe("ProtectedShellTemplate", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
  });

  it("shows the full desktop navigation for super administrators", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["SuperAdministrator"],
      userName: "systemadministrator"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate
            subtitle="Shell subtitle"
            title="Dashboard"
          >
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^workspace$/i })).toBeDefined();
    });

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeDefined();
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^workspace$/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^users$/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^roles$/i })).toBeDefined();
    expect(screen.getByText(/all workspaces/i)).toBeDefined();
    expect(screen.getAllByText(/^workspace$/i)).toHaveLength(1);
    expect(screen.queryByText(/^navigation$/i)).toBeNull();
    expect(screen.queryByText(/^systemadministrator$/i)).toBeNull();
    expect(screen.getByText(new RegExp(`Copyright \\(c\\) ${new Date().getFullYear()}`, "i"))).toBeDefined();
    expect(screen.queryByRole("button", { name: /open navigation/i })).toBeNull();
  });

  it("limits the navigation for non-super-administrators", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-2",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate
            subtitle="Shell subtitle"
            title="Dashboard"
          >
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeDefined();
    });

    expect(screen.getByRole("link", { name: /^users$/i })).toBeDefined();
    expect(screen.queryByRole("link", { name: /^workspace$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^roles$/i })).toBeNull();
  });

  it("uses a drawer navigation on tablet and mobile layouts", async () => {
    setDesktopMode(false);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["SuperAdministrator"],
      userName: "systemadministrator"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate
            subtitle="Shell subtitle"
            title="Dashboard"
          >
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    const openNavigationButton = await screen.findByRole("button", { name: /open navigation/i });
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();

    fireEvent.click(openNavigationButton);

    expect(await screen.findByRole("link", { name: /^workspace$/i })).toBeDefined();
    expect(screen.getAllByText(/opensaur identity/i)).toHaveLength(1);
  });

  it("shows impersonation workspace state and exposes an exit action when provided", async () => {
    const onExitImpersonation = vi.fn();

    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["SuperAdministrator"],
      userName: "System Administrator"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate
            impersonation={{
              onExit: onExitImpersonation,
              workspaceName: "Contoso Workspace"
            }}
            title="Dashboard"
          >
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    expect(await screen.findByText(/contoso workspace/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /exit impersonation/i }));

    expect(onExitImpersonation).toHaveBeenCalledOnce();
  });

  it("opens the account menu from the avatar button", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["SuperAdministrator"],
      userName: "Hao Du"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate title="Dashboard">
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /open account menu/i }));

    expect(screen.getByRole("menuitem", { name: /my profile/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /my profile/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /change password/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /change password/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /settings/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /logout/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByText(/^hd$/i)).toBeDefined();
  });

  it("navigates to the change-password page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              element={(
                <ProtectedShellTemplate title="Dashboard">
                  <div>Dashboard content</div>
                </ProtectedShellTemplate>
              )}
              path="/"
            />
            <Route
              element={<div>Change password</div>}
              path="/change-password"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /open account menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/change-password");
    });
  });

  it("logs out and returns to the login page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin"
    });
    vi.mocked(authApi.logout).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.logout>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              element={(
                <ProtectedShellTemplate
                  subtitle="Shell subtitle"
                  title="Dashboard"
                >
                  <div>Dashboard content</div>
                </ProtectedShellTemplate>
              )}
              path="/"
            />
            <Route
              element={<div>Login</div>}
              path="/login"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /open account menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/login");
    });

    expect(authApi.logout).toHaveBeenCalledOnce();
    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: null,
      expiresAt: null,
      status: "anonymous"
    });
  });
});
