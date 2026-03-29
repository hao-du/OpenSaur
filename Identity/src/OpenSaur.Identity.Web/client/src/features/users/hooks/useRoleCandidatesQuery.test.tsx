import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders, createAppQueryClient } from "../../../app/providers/AppProviders";
import * as usersApi from "../api";
import { useRoleCandidatesQuery } from "./useRoleCandidatesQuery";

const useCurrentUserStateMock = vi.fn();

vi.mock("../../auth/hooks/useCurrentUserState", () => ({
  useCurrentUserState: () => useCurrentUserStateMock()
}));

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");

  return {
    ...actual,
    getRoleCandidates: vi.fn()
  };
});

describe("useRoleCandidatesQuery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refetches role candidates when the authenticated workspace context changes", async () => {
    const queryClient = createAppQueryClient();
    let currentUser = {
      id: "system-admin",
      isImpersonating: false,
      workspaceName: "All workspaces"
    };
    useCurrentUserStateMock.mockImplementation(() => ({
      data: currentUser
    }));
    vi.mocked(usersApi.getRoleCandidates)
      .mockResolvedValueOnce([
        {
          description: "Original workspace role set",
          roleId: "role-1",
          roleName: "Administrator",
          roleNormalizedName: "ADMINISTRATOR"
        }
      ])
      .mockResolvedValueOnce([
        {
          description: "Updated workspace role set",
          roleId: "role-1",
          roleName: "Administrator",
          roleNormalizedName: "ADMINISTRATOR"
        },
        {
          description: "Newly assigned workspace role",
          roleId: "role-2",
          roleName: "Content Writer",
          roleNormalizedName: "CONTENT_WRITER"
        }
      ]);

    const { result, rerender } = renderHook(() => useRoleCandidatesQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    expect(usersApi.getRoleCandidates).toHaveBeenCalledTimes(1);

    currentUser = {
      id: "testuser01",
      isImpersonating: true,
      workspaceName: "Test Workspace 1"
    };
    rerender();

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
    expect(usersApi.getRoleCandidates).toHaveBeenCalledTimes(2);
  });
});
