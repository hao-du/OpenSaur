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

const useExitImpersonationMock = vi.fn();
const useSyncAuthenticatedPreferencesMock = vi.fn();

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    logout: vi.fn()
  };
});

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useExitImpersonation: () => useExitImpersonationMock()
  };
});

vi.mock("../../features/preferences/hooks", () => ({
  useSyncAuthenticatedPreferences: () => useSyncAuthenticatedPreferencesMock()
}));

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
    window.localStorage?.clear?.();
    sessionStorage.clear();
    vi.resetAllMocks();
    useSyncAuthenticatedPreferencesMock.mockReturnValue(vi.fn().mockResolvedValue(null));
    useExitImpersonationMock.mockReturnValue({
      errorMessage: null,
      exitImpersonation: vi.fn(),
      isExitingImpersonation: false
    });
  });

  it("shows the full desktop navigation for super administrators", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "systemadministrator",
      workspaceName: "All workspaces"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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
    expect(screen.queryByRole("link", { name: /^users$/i })).toBeNull();
    expect(screen.getByRole("link", { name: /^roles$/i })).toBeDefined();
    expect(screen.queryByRole("link", { name: /^role assignments$/i })).toBeNull();
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
      canManageUsers: true,
      id: "user-2",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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
      expect(screen.getByRole("link", { name: /^users$/i })).toBeDefined();
    });

    expect(screen.getByRole("link", { name: /^users$/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^role assignments$/i })).toBeDefined();
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
      canManageUsers: false,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "systemadministrator",
      workspaceName: "All workspaces"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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

  it("shows impersonation workspace state from the authenticated user context", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      id: "user-1",
      isImpersonating: true,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "System Administrator",
      workspaceName: "Contoso Workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate title="Dashboard">
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    expect(await screen.findByText(/contoso workspace/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /exit impersonation/i })).toBeDefined();
    expect(screen.queryByText(/^exit impersonation$/i)).toBeNull();
    expect(screen.getByRole("link", { name: /^role assignments$/i })).toBeDefined();
    expect(screen.queryByRole("link", { name: /^workspace$/i })).toBeNull();
  });

  it("exits impersonation and restores the super-administrator workspace state", async () => {
    setDesktopMode(true);
    const exitImpersonation = vi.fn().mockResolvedValue({
      accessToken: "restored-access-token",
      expiresAt: "2026-03-29T00:00:00.000Z"
    });

    useExitImpersonationMock.mockReturnValue({
      errorMessage: null,
      exitImpersonation,
      isExitingImpersonation: false
    });
    authSessionStore.setAuthenticatedSession({
      accessToken: "impersonated-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser)
      .mockResolvedValueOnce({
        canManageUsers: false,
        id: "user-1",
        isImpersonating: true,
        requirePasswordChange: false,
        roles: ["Administrator"],
        userName: "finance.admin",
        workspaceName: "Contoso Workspace"
      } as Awaited<ReturnType<typeof authApi.getCurrentUser>>)
      .mockResolvedValueOnce({
        canManageUsers: false,
        id: "user-2",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate title="Dashboard">
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /exit impersonation/i }));

    await waitFor(() => {
      expect(exitImpersonation).toHaveBeenCalledOnce();
      expect(screen.getByText(/all workspaces/i)).toBeDefined();
    });
  });

  it("opens the account menu from the avatar button", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "Hao Du",
      workspaceName: "All workspaces"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <ProtectedShellTemplate title="Dashboard">
            <div>Dashboard content</div>
          </ProtectedShellTemplate>
        </MemoryRouter>
      </AppProviders>
    );

    const accountMenuButton = await screen.findByRole("button", { name: /open account menu/i });

    await waitFor(() => {
      expect(accountMenuButton.textContent).toMatch(/^hd$/i);
    });

    fireEvent.click(accountMenuButton);

    expect(screen.getByRole("menuitem", { name: /my profile/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /my profile/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /change password/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /change password/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /settings/i }).querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /logout/i }).querySelector("svg")).not.toBeNull();
  });

  it("navigates to the change-password page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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

  it("navigates to the profile page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      email: "workspace.admin@opensaur.test",
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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
              element={<div>Profile</div>}
              path="/profile"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /open account menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /my profile/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/profile");
    });
  });

  it("navigates to the settings page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      email: "workspace.admin@opensaur.test",
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);

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
              element={<div>Settings</div>}
              path="/settings"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(await screen.findByRole("button", { name: /open account menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /settings/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/settings");
    });
  });

  it("logs out and returns to the login page from the account menu", async () => {
    setDesktopMode(true);
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    } as Awaited<ReturnType<typeof authApi.getCurrentUser>>);
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
