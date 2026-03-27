import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
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
    const queryClient = new QueryClient();
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
});
