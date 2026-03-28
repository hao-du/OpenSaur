import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import * as authApi from "../../features/auth/api/authApi";
import { authQueryKeys } from "../../features/auth/queries/authQueryKeys";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { ChangePasswordPage } from "./ChangePasswordPage";

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    changePassword: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn()
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

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });
  });

  it("renders the password-rotation form", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={["/change-password"]}>
          <ChangePasswordPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 3, name: /change password/i })).toBeDefined();
    expect(screen.getByText(/update your password to continue/i)).toBeDefined();
    expect(screen.queryByRole("heading", { level: 5, name: /update your password/i })).toBeNull();
    expect(screen.queryByText(/choose a new password, then sign in again/i)).toBeNull();
    expect(screen.getByLabelText(/current password/i)).toBeDefined();
    expect(screen.getByLabelText(/^new password$/i)).toBeDefined();
    expect(screen.getByLabelText(/confirm new password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^back$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^back$/i }).querySelector("svg")).not.toBeNull();
    expect(screen.queryByText(/protected shell/i)).toBeNull();
    expect(screen.queryByText(/bootstrap credential/i)).toBeNull();
  });

  it("returns to the previous page when the password change was opened from the shell", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: "/change-password", state: { from: "/users?tab=active" } }]}>
          <Routes>
            <Route
              element={<ChangePasswordPage />}
              path="/change-password"
            />
            <Route
              element={<div>Users</div>}
              path="/users"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/users?tab=active");
    });
  });

  it("falls back to the dashboard when there is no previous page for an optional password change", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={["/change-password"]}>
          <Routes>
            <Route
              element={<ChangePasswordPage />}
              path="/change-password"
            />
            <Route
              element={<div>Dashboard</div>}
              path="/"
            />
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/");
    });
  });

  it("hides the back navigation when the user is required to change the password", () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: true,
      roles: ["User"],
      userName: "demo.user"
    });

    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: true,
      roles: ["User"],
      userName: "demo.user"
    });

    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={["/change-password"]}>
          <ChangePasswordPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.queryByRole("button", { name: /^back$/i })).toBeNull();
  });

  it("changes the password, signs the user out, and returns to login with the preserved route", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: true,
      roles: ["User"],
      userName: "demo.user"
    });

    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    authSessionStore.rememberReturnUrl("/reports");

    vi.mocked(authApi.changePassword).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.changePassword>>);
    vi.mocked(authApi.logout).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.logout>>);

    render(
      <AppProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={["/change-password"]}>
          <Routes>
            <Route
              element={<ChangePasswordPage />}
              path="/change-password"
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

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "Password1" }
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "Password2!" }
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "Password2!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/login?returnUrl=%2Freports");
    });

    expect(vi.mocked(authApi.changePassword).mock.calls[0]?.[0]).toEqual({
      currentPassword: "Password1",
      newPassword: "Password2!"
    });
    expect(authApi.logout).toHaveBeenCalledOnce();
    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: null,
      expiresAt: null,
      status: "anonymous"
    });
    expect(authSessionStore.getRememberedReturnUrl()).toBe("/reports");
    expect(queryClient.getQueryData(authQueryKeys.currentUser())).toBeUndefined();
  });

  it("falls back to the dashboard when the remembered return url points back to change-password", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    authSessionStore.rememberReturnUrl("/change-password");

    vi.mocked(authApi.changePassword).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.changePassword>>);
    vi.mocked(authApi.logout).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.logout>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/change-password"]}>
          <Routes>
            <Route
              element={<ChangePasswordPage />}
              path="/change-password"
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

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "Password1" }
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "Password2!" }
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "Password2!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/login?returnUrl=%2F");
    });

    expect(authSessionStore.getRememberedReturnUrl()).toBe("/");
  });

  it("shows a confirmation error when the new passwords do not match", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/change-password"]}>
          <ChangePasswordPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "Password1" }
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "Password2!" }
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "Password3!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeDefined();
    });

    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it("shows the backend validation detail when the password change is rejected", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    vi.mocked(authApi.changePassword).mockRejectedValue(
      new axios.AxiosError(
        "Request failed",
        "400",
        undefined,
        undefined,
        {
          config: {} as never,
          data: {
            errors: [
              {
                detail: "Passwords must have at least one non alphanumeric character.",
                message: "Validation failed."
              }
            ]
          },
          headers: {},
          status: 400,
          statusText: "Bad Request"
        }
      )
    );

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/change-password"]}>
          <ChangePasswordPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "Password1" }
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "Password2" }
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "Password2" }
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/passwords must have at least one non alphanumeric character/i)
      ).toBeDefined();
    });
  });
});
