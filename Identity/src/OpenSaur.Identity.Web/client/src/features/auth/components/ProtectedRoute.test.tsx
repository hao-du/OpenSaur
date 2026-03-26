import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { authSessionStore } from "../state/authSessionStore";
import { ProtectedRoute } from "./ProtectedRoute";

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
  });

  it("redirects anonymous users to login and preserves the return url", async () => {
    render(
      <MemoryRouter initialEntries={["/?tab=recent"]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>Protected home</div>
              </ProtectedRoute>
            }
            path="/"
          />
          <Route
            element={<div>Login</div>}
            path="/login"
          />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/login?returnUrl=%2F%3Ftab%3Drecent");
    });

    expect(authSessionStore.consumeReturnUrl()).toBe("/?tab=recent");
  });

  it("renders protected content when an authenticated session exists", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>Protected home</div>
              </ProtectedRoute>
            }
            path="/"
          />
          <Route
            element={<div>Login</div>}
            path="/login"
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected home")).toBeDefined();
    });
  });
});
