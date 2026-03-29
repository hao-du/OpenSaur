import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { SettingsPage } from "./SettingsPage";

const useCurrentUserStateMock = vi.fn();
const useCurrentUserSettingsMutationMock = vi.fn();

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

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserState: () => useCurrentUserStateMock()
  };
});

vi.mock("../../features/preferences/hooks", () => ({
  useSyncAuthenticatedPreferences: () => vi.fn().mockResolvedValue(null),
  useUpdateCurrentUserSettings: () => useCurrentUserSettingsMutationMock()
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    ensureLocalStorage();
    window.localStorage.clear();
    vi.resetAllMocks();

    useCurrentUserStateMock.mockReturnValue({
      data: {
        canManageUsers: true,
        email: "workspace.admin@opensaur.test",
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["ADMINISTRATOR"],
        userName: "workspace.admin",
        workspaceName: "Operations"
      },
      isPending: false
    });
    useCurrentUserSettingsMutationMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      updateSettings: vi.fn().mockResolvedValue({
        locale: "vi",
        timeZone: "Asia/Saigon"
      })
    });
  });

  it("saves locale and time zone changes", async () => {
    const updateSettings = vi.fn().mockResolvedValue({
      locale: "vi",
      timeZone: "Asia/Saigon"
    });
    useCurrentUserSettingsMutationMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      updateSettings
    });

    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/settings"]}>
          <SettingsPage />
        </MemoryRouter>
      </AppProviders>
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /locale/i }));
    fireEvent.click(await screen.findByRole("option", { name: /vietnamese/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /time zone/i }), {
      target: { value: "Asia/Saigon" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({
        locale: "vi",
        timeZone: "Asia/Saigon"
      });
    });

    expect(JSON.parse(window.localStorage.getItem("opensaur.identity.preferences") ?? "{}")).toEqual({
      locale: "vi",
      timeZone: "Asia/Saigon"
    });
  });
});
