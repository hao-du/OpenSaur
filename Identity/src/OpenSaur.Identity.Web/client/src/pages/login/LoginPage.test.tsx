import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
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

vi.mock("../../features/auth/utils/firstPartyOidc", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/utils/firstPartyOidc")>("../../features/auth/utils/firstPartyOidc");

  return {
    ...actual,
    buildFirstPartyAuthorizeUrl: vi.fn(() => "https://app.duchihao.com/identity/connect/authorize?state=test-state"),
    createFirstPartyAuthorizationState: vi.fn(() => "test-state"),
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

  it("starts the issuer-hosted authorize flow on load", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 3, name: /^sign in$/i })).toBeDefined();
    expect(screen.getAllByText(/preparing your session/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /continue to sign in/i })).toBeDefined();

    await waitFor(() => {
      expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledWith("https://app.duchihao.com/identity/connect/authorize?state=test-state");
    });
  });

  it("stores the normalized return url before starting authorization", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login?returnUrl=%2Freports%3Ftab%3Drecent"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledWith("https://app.duchihao.com/identity/connect/authorize?state=test-state");
    });

    expect(authSessionStore.consumeReturnUrl()).toBe("/reports?tab=recent");
  });

  it("allows manual continuation if automatic redirect does not happen", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AppProviders>
    );

    await waitFor(() => {
      expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledWith("https://app.duchihao.com/identity/connect/authorize?state=test-state");
    });

    fireEvent.click(screen.getByRole("link", { name: /continue to sign in/i }));

    await waitFor(() => {
      expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledTimes(2);
    });
  });

  it("restores Vietnamese locale before issuer redirect", async () => {
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
    expect(screen.getByRole("progressbar")).toBeDefined();

    await waitFor(() => {
      expect(firstPartyOidc.startFirstPartyAuthorization).toHaveBeenCalledWith("https://app.duchihao.com/identity/connect/authorize?state=test-state");
    });
  });
});
