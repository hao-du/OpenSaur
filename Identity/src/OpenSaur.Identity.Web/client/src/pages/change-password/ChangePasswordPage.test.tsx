import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
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
  });

  it("renders the password-rotation form", () => {
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

    expect(screen.getByRole("heading", { level: 3, name: /change password/i })).toBeDefined();
    expect(screen.getByLabelText(/current password/i)).toBeDefined();
    expect(screen.getByLabelText(/^new password$/i)).toBeDefined();
    expect(screen.getByLabelText(/confirm new password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDefined();
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
});
