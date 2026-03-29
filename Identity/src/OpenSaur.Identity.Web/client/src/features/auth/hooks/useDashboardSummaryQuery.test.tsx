import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders, createAppQueryClient } from "../../../app/providers/AppProviders";
import * as authApi from "../api/authApi";
import { authSessionStore } from "../state/authSessionStore";
import { useDashboardSummaryQuery } from "./useDashboardSummaryQuery";

const useCurrentUserStateMock = vi.fn();

vi.mock("./useCurrentUserState", () => ({
  useCurrentUserState: () => useCurrentUserStateMock()
}));

vi.mock("../api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../api/authApi")>("../api/authApi");

  return {
    ...actual,
    getDashboardSummary: vi.fn()
  };
});

describe("useDashboardSummaryQuery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authSessionStore.clearSession();
  });

  it("refetches the dashboard summary when the authenticated workspace context changes", async () => {
    const queryClient = createAppQueryClient();
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: "2026-03-29T00:00:00.000Z"
    });
    let currentUser = {
      id: "system-admin",
      isImpersonating: false,
      workspaceName: "All workspaces"
    };
    useCurrentUserStateMock.mockImplementation(() => ({
      data: currentUser
    }));
    vi.mocked(authApi.getDashboardSummary)
      .mockResolvedValueOnce({
        activeUserCount: 15,
        activeWorkspaceCount: 3,
        availableRoleCount: 6,
        inactiveUserCount: 2,
        maxActiveUsers: null,
        scope: "global",
        workspaceCount: 4,
        workspaceName: null
      })
      .mockResolvedValueOnce({
        activeUserCount: 3,
        activeWorkspaceCount: 1,
        availableRoleCount: 2,
        inactiveUserCount: 0,
        maxActiveUsers: 10,
        scope: "workspace",
        workspaceCount: 1,
        workspaceName: "Test Workspace 1"
      });

    const { result, rerender } = renderHook(() => useDashboardSummaryQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await waitFor(() => {
      expect(result.current.data?.scope).toBe("global");
    });
    expect(authApi.getDashboardSummary).toHaveBeenCalledTimes(1);

    currentUser = {
      id: "testuser01",
      isImpersonating: true,
      workspaceName: "Test Workspace 1"
    };
    rerender();

    await waitFor(() => {
      expect(result.current.data?.scope).toBe("workspace");
    });
    expect(authApi.getDashboardSummary).toHaveBeenCalledTimes(2);
  });
});
