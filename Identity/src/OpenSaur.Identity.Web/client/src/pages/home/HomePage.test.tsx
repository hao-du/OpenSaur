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
import { HomePage } from "./HomePage";

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
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

describe("HomePage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
  });

  it("renders the protected user summary", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "demo.user"
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <HomePage />
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("demo.user")).toBeDefined();
    });

    expect(screen.getByText(/administrator/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /logout/i })).toBeDefined();
  });

  it("logs out and returns to the login page", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "demo.user"
    });
    vi.mocked(authApi.logout).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.logout>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              element={<HomePage />}
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

    await waitFor(() => {
      expect(screen.getByText("demo.user")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

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
