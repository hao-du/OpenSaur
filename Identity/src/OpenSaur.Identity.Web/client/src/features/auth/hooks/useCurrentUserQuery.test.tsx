import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders, createAppQueryClient } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { authQueryKeys } from "../queries/authQueryKeys";
import { useCurrentUserQuery } from "./useCurrentUserQuery";

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn()
  };
});

describe("useCurrentUserQuery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fetches and clears the current user query", async () => {
    const queryClient = createAppQueryClient();
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });

    const { result } = renderHook(() => useCurrentUserQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    const currentUser = await result.current.fetchCurrentUser();

    expect(currentUser).toEqual({
      id: "user-1",
      requirePasswordChange: false,
      roles: ["User"],
      userName: "demo.user"
    });
    expect(queryClient.getQueryData(authQueryKeys.currentUser())).toEqual(currentUser);

    result.current.clearCurrentUser();

    expect(queryClient.getQueryData(authQueryKeys.currentUser())).toBeUndefined();
  });

  it("forces a fresh current-user fetch even when cached data is still fresh", async () => {
    const queryClient = createAppQueryClient();
    queryClient.setQueryData(authQueryKeys.currentUser(), {
      id: "user-1",
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "cached.user"
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      id: "user-2",
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "fresh.user"
    });

    const { result } = renderHook(() => useCurrentUserQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    const currentUser = await result.current.fetchCurrentUser();

    expect(authApi.getCurrentUser).toHaveBeenCalledOnce();
    expect(currentUser).toEqual({
      id: "user-2",
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "fresh.user"
    });
  });
});
