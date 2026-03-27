import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { useLogin } from "./useLogin";

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    login: vi.fn()
  };
});

describe("useLogin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("wraps login in a TanStack mutation", async () => {
    const queryClient = new QueryClient();
    vi.mocked(authApi.login).mockResolvedValue({
      data: { data: null, errors: [], success: true }
    } as Awaited<ReturnType<typeof authApi.login>>);

    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await result.current.login({
      password: "Password1!",
      userName: "demo.user"
    });

    expect(vi.mocked(authApi.login).mock.calls[0]?.[0]).toEqual({
      password: "Password1!",
      userName: "demo.user"
    });
  });
});
