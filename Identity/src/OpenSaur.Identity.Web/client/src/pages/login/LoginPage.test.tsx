import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import * as authApi from "../../features/auth/api/authApi";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import * as firstPartyOidc from "../../features/auth/utils/firstPartyOidc";
import { LoginPage } from "./LoginPage";

function ensureLocalStorage() {
  const store = new Map<string, string>();
  const storage = {
    clear: vi.fn(() => {
      store.clear();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn(),
    length: 0,
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    })
  } satisfies Partial<Storage>;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage
  });
}

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    login: vi.fn()
  };
});

vi.mock("../../features/auth/utils/firstPartyOidc", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/utils/firstPartyOidc")>("../../features/auth/utils/firstPartyOidc");

  return {
    ...actual,
    startFirstPartyAuthorization: vi.fn()
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    ensureLocalStorage();
    window.localStorage.clear();
    sessionStorage.clear();
    vi.resetAllMocks();
  });

  it("renders the sign in form with user-facing copy", () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 3, name: /^sign in$/i })).toBeDefined();
    expect(
      screen.getByText(/sign in to continue and pick up where you left off/i)
    ).toBeDefined();
    expect(screen.getByLabelText(/username/i)).toBeDefined();
    expect(screen.getByLabelText(/^password$/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
    expect(screen.queryByText(/hosted sign in/i)).toBeNull();
    expect(screen.queryByText(/first-party identity shell/i)).toBeNull();
    expect(screen.queryByText(/authorization flow/i)).toBeNull();
  });

  it("posts credentials and starts the first-party authorize flow", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.login>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login?returnUrl=%2Freports%3Ftab%3Drecent"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "demo.user" }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(vi.mocked(authApi.login).mock.calls[0]?.[0]).toEqual({
        password: "Password1!",
        userName: "demo.user"
      });
    });

    expect(authSessionStore.consumeReturnUrl()).toBe("/reports?tab=recent");
    expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledOnce();
  });

  it("shows an error message when the hosted login request fails", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("invalid credentials"));

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "demo.user" }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/sign in failed/i)).toBeDefined();
    });

    expect(firstPartyOidc.startFirstPartyAuthorization).not.toHaveBeenCalled();
  });

  it("shows a visible loading indicator while the hosted login request is pending", async () => {
    vi.mocked(authApi.login).mockReturnValue(new Promise(() => {}) as Awaited<ReturnType<typeof authApi.login>>);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "demo.user" }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDefined();
      expect(screen.getByRole("progressbar")).toBeDefined();
    });
  });

  it("restores Vietnamese locale from local storage before authentication", () => {
    window.localStorage.setItem("opensaur.identity.preferences", JSON.stringify({
      locale: "vi",
      timeZone: "Asia/Saigon"
    }));

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 3, name: /đăng nhập/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^đăng nhập$/i })).toBeDefined();
  });
});
