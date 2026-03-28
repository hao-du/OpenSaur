import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { AuthCallbackPage } from "./AuthCallbackPage";
import * as authApi from "../../features/auth/api/authApi";

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    exchangeWebSession: vi.fn(),
    getCurrentUser: vi.fn()
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

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
  });

  it("renders neutral progress copy while sign-in is being completed", () => {
    vi.mocked(authApi.exchangeWebSession).mockReturnValue(
      new Promise(() => {}) as Awaited<ReturnType<typeof authApi.exchangeWebSession>>
    );

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/auth/callback?code=render-copy-code"]}>
          <AuthCallbackPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 3, name: /signing you in/i })).toBeDefined();
    expect(screen.getByText(/please wait while we sign you in/i)).toBeDefined();
    expect(screen.getByText(/preparing your account/i)).toBeDefined();
    expect(screen.queryByText(/authorization code flow/i)).toBeNull();
    expect(screen.queryByText(/^callback$/i)).toBeNull();
  });

  it("exchanges the authorization code, bootstraps the current user, and redirects to the remembered route", async () => {
    authSessionStore.rememberReturnUrl("/users");
    vi.mocked(authApi.exchangeWebSession).mockResolvedValue({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
          <Routes>
            <Route
              element={<AuthCallbackPage />}
              path="/auth/callback"
            />
            <Route
              element={<div>Users</div>}
              path="/users"
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

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/users");
    });

    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z",
      status: "authenticated"
    });
    expect(authApi.exchangeWebSession).toHaveBeenCalledWith(
      { code: "test-code" },
      expect.any(Object)
    );
    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });

  it("exchanges the authorization code only once in StrictMode", async () => {
    authSessionStore.rememberReturnUrl("/");
    vi.mocked(authApi.exchangeWebSession).mockResolvedValue({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: true,
      roles: ["User"],
      userName: "demo.user"
    });

    render(
      <StrictMode>
        <AppProviders>
          <MemoryRouter initialEntries={["/auth/callback?code=strict-mode-code"]}>
            <Routes>
              <Route
                element={<AuthCallbackPage />}
                path="/auth/callback"
              />
              <Route
                element={<div>Change password</div>}
                path="/change-password"
              />
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </AppProviders>
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/change-password");
    });

    expect(authApi.exchangeWebSession).toHaveBeenCalledTimes(1);
  });

  it("falls back to the dashboard when the remembered return url points back to change-password", async () => {
    authSessionStore.rememberReturnUrl("/change-password");
    vi.mocked(authApi.exchangeWebSession).mockResolvedValue({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
          <Routes>
            <Route
              element={<AuthCallbackPage />}
              path="/auth/callback"
            />
            <Route
              element={<div>Dashboard</div>}
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

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/");
    });
  });
});
