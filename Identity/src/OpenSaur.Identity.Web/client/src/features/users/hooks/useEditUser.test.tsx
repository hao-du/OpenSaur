import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import * as userApi from "../api/usersApi";
import { userQueryKeys } from "../queries/userQueryKeys";
import { useEditUser } from "./useEditUser";

vi.mock("../api/usersApi", async () => {
  const actual = await vi.importActual<typeof import("../api/usersApi")>("../api/usersApi");

  return {
    ...actual,
    editUser: vi.fn()
  };
});

describe("useEditUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("invalidates the current-user query after editing a user", async () => {
    const queryClient = new QueryClient();
    vi.mocked(userApi.editUser).mockResolvedValue(undefined);

    queryClient.setQueryData(authQueryKeys.currentUser(), {
      firstName: "",
      id: "user-1",
      lastName: "",
      userName: "testuser01"
    });
    queryClient.setQueryData(userQueryKeys.all(), []);
    queryClient.setQueryData(userQueryKeys.detail("user-1"), {
      id: "user-1"
    });

    const { result } = renderHook(() => useEditUser(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.editUser({
        description: "",
        email: "testuser01@gmail.com",
        firstName: "Test",
        id: "user-1",
        isActive: true,
        lastName: "Example",
        userName: "testuser01",
        userSettings: "{}"
      });
    });

    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(true);
  });
});
