import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { useRefreshWebSession } from "./useRefreshWebSession";

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    refreshWebSession: vi.fn()
  };
});

describe("useRefreshWebSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("wraps refreshWebSession in a TanStack mutation", async () => {
    const queryClient = new QueryClient();
    vi.mocked(authApi.refreshWebSession).mockResolvedValue({
      accessToken: "refreshed-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    const { result } = renderHook(() => useRefreshWebSession(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    const session = await result.current.refreshSession();

    expect(session).toEqual({
      accessToken: "refreshed-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    expect(authApi.refreshWebSession).toHaveBeenCalledOnce();
  });
});
