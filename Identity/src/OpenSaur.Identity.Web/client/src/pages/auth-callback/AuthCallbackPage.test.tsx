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

  it("exchanges the authorization code, bootstraps the current user, and redirects to the remembered route", async () => {
    authSessionStore.rememberReturnUrl("/reports");
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
              element={<div>Reports</div>}
              path="/reports"
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
      expect(screen.getByTestId("location").textContent).toBe("/reports");
    });

    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z",
      status: "authenticated"
    });
    expect(authApi.exchangeWebSession).toHaveBeenCalledWith({ code: "test-code" });
    expect(authApi.getCurrentUser).toHaveBeenCalled();
  });
});
