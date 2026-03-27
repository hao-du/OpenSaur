import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { authQueryKeys } from "../queries/authQueryKeys";
import { authSessionStore } from "../state/authSessionStore";
import { AuthBootstrapBoundary } from "./AuthBootstrapBoundary";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn(),
    refreshWebSession: vi.fn()
  };
});

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

describe("AuthBootstrapBoundary", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
  });

  it("bootstraps a protected route from the backend refresh session", async () => {
    const queryClient = new QueryClient();

    vi.mocked(authApi.refreshWebSession).mockResolvedValue({
      accessToken: "refreshed-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={["/reports"]}>
          <AuthBootstrapBoundary>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <div>Reports</div>
                  </ProtectedRoute>
                }
                path="/reports"
              />
              <Route
                element={<div>Login</div>}
                path="/login"
              />
            </Routes>
            <LocationProbe />
          </AuthBootstrapBoundary>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("Reports")).toBeDefined();
    });

    expect(authApi.refreshWebSession).toHaveBeenCalledOnce();
    expect(authApi.getCurrentUser).toHaveBeenCalledOnce();
    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: "refreshed-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z",
      status: "authenticated"
    });
    expect(queryClient.getQueryData(authQueryKeys.currentUser())).toEqual({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });
  });

  it("falls back to login with the preserved route when bootstrap refresh fails", async () => {
    vi.mocked(authApi.refreshWebSession).mockRejectedValue(new Error("expired"));

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/reports?tab=recent"]}>
          <AuthBootstrapBoundary>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <div>Reports</div>
                  </ProtectedRoute>
                }
                path="/reports"
              />
              <Route
                element={<div>Login</div>}
                path="/login"
              />
            </Routes>
            <LocationProbe />
          </AuthBootstrapBoundary>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/login?returnUrl=%2Freports%3Ftab%3Drecent");
    });

    expect(authApi.getCurrentUser).not.toHaveBeenCalled();
    expect(authSessionStore.consumeReturnUrl()).toBe("/reports?tab=recent");
  });

  it("refreshes an authenticated session when the token is close to expiry", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "old-access-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    vi.mocked(authApi.refreshWebSession).mockResolvedValue({
      accessToken: "new-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/reports"]}>
          <AuthBootstrapBoundary>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <div>Reports</div>
                  </ProtectedRoute>
                }
                path="/reports"
              />
              <Route
                element={<div>Login</div>}
                path="/login"
              />
            </Routes>
          </AuthBootstrapBoundary>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(authSessionStore.getSnapshot()).toEqual({
        accessToken: "new-access-token",
        expiresAt: "2026-03-28T00:00:00.000Z",
        status: "authenticated"
      });
    });

    expect(authApi.refreshWebSession).toHaveBeenCalledOnce();
  });

  it("redirects to change-password and preserves the requested route when bootstrap requires password rotation", async () => {
    vi.mocked(authApi.refreshWebSession).mockResolvedValue({
      accessToken: "refreshed-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: true,
      roles: ["User"],
      userName: "demo.user"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/reports"]}>
          <AuthBootstrapBoundary>
            <Routes>
              <Route
                element={
                  <ProtectedRoute>
                    <div>Reports</div>
                  </ProtectedRoute>
                }
                path="/reports"
              />
              <Route
                element={<div>Change password</div>}
                path="/change-password"
              />
            </Routes>
            <LocationProbe />
          </AuthBootstrapBoundary>
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/change-password");
    });

    expect(authSessionStore.getRememberedReturnUrl()).toBe("/reports");
  });
});
