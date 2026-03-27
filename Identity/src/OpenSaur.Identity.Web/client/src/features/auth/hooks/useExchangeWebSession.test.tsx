import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { useExchangeWebSession } from "./useExchangeWebSession";

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    exchangeWebSession: vi.fn()
  };
});

describe("useExchangeWebSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("wraps exchangeWebSession in a TanStack mutation", async () => {
    const queryClient = new QueryClient();
    vi.mocked(authApi.exchangeWebSession).mockResolvedValue({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    const { result } = renderHook(() => useExchangeWebSession(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    const session = await result.current.exchangeSession({ code: "test-code" });

    expect(session).toEqual({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });
    expect(authApi.exchangeWebSession).toHaveBeenCalledWith(
      { code: "test-code" },
      expect.any(Object)
    );
  });
});
