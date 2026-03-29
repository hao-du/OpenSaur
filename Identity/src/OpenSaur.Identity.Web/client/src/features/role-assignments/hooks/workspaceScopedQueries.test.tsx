import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders, createAppQueryClient } from "../../../app/providers/AppProviders";
import * as roleAssignmentsApi from "../api";
import { useAssignmentCandidatesQuery } from "./useAssignmentCandidatesQuery";
import { useAvailableRolesQuery } from "./useAvailableRolesQuery";

const useCurrentUserStateMock = vi.fn();

vi.mock("../../auth/hooks/useCurrentUserState", () => ({
  useCurrentUserState: () => useCurrentUserStateMock()
}));

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");

  return {
    ...actual,
    getAssignmentCandidates: vi.fn(),
    getAvailableRoles: vi.fn()
  };
});

describe("workspace-scoped role assignment queries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refetches available roles when the authenticated workspace context changes", async () => {
    const queryClient = createAppQueryClient();
    let currentUser = {
      id: "system-admin",
      isImpersonating: false,
      workspaceName: "All workspaces"
    };
    useCurrentUserStateMock.mockImplementation(() => ({
      data: currentUser
    }));
    vi.mocked(roleAssignmentsApi.getAvailableRoles)
      .mockResolvedValueOnce([
        {
          description: "Existing role set",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        }
      ])
      .mockResolvedValueOnce([
        {
          description: "Existing role set",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        },
        {
          description: "New workspace role",
          id: "role-2",
          isActive: true,
          name: "Content Writer",
          normalizedName: "CONTENT_WRITER"
        }
      ]);

    const { result, rerender } = renderHook(() => useAvailableRolesQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    expect(roleAssignmentsApi.getAvailableRoles).toHaveBeenCalledTimes(1);

    currentUser = {
      id: "testuser01",
      isImpersonating: true,
      workspaceName: "Test Workspace 1"
    };
    rerender();

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
    expect(roleAssignmentsApi.getAvailableRoles).toHaveBeenCalledTimes(2);
  });

  it("refetches assignment candidates when the authenticated workspace context changes", async () => {
    const queryClient = createAppQueryClient();
    let currentUser = {
      id: "system-admin",
      isImpersonating: false,
      workspaceName: "All workspaces"
    };
    useCurrentUserStateMock.mockImplementation(() => ({
      data: currentUser
    }));
    vi.mocked(roleAssignmentsApi.getAssignmentCandidates)
      .mockResolvedValueOnce([
        {
          email: "systemadministrator@example.com",
          id: "user-1",
          userName: "SystemAdministrator",
          workspaceName: "All workspaces"
        }
      ])
      .mockResolvedValueOnce([
        {
          email: "testuser01@example.com",
          id: "user-2",
          userName: "testuser01",
          workspaceName: "Test Workspace 1"
        }
      ]);

    const { result, rerender } = renderHook(() => useAssignmentCandidatesQuery(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    expect(roleAssignmentsApi.getAssignmentCandidates).toHaveBeenCalledTimes(1);

    currentUser = {
      id: "testuser01",
      isImpersonating: true,
      workspaceName: "Test Workspace 1"
    };
    rerender();

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]?.workspaceName).toBe("Test Workspace 1");
    });
    expect(roleAssignmentsApi.getAssignmentCandidates).toHaveBeenCalledTimes(2);
  });
});
