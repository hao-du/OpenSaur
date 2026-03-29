import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import * as workspaceApi from "../api/workspacesApi";
import { workspaceQueryKeys } from "../queries/workspaceQueryKeys";
import { useEditWorkspace } from "./useEditWorkspace";

vi.mock("../api/workspacesApi", async () => {
  const actual = await vi.importActual<typeof import("../api/workspacesApi")>("../api/workspacesApi");

  return {
    ...actual,
    editWorkspace: vi.fn()
  };
});

describe("useEditWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("invalidates the workspaces list without refetching the open detail query", async () => {
    const queryClient = new QueryClient();
    vi.mocked(workspaceApi.editWorkspace).mockResolvedValue(undefined);
    const workspaceScope = {
      isImpersonating: true,
      userId: "testuser01",
      workspaceName: "Test Workspace 1"
    };

    queryClient.setQueryData(workspaceQueryKeys.list(), []);
    queryClient.setQueryData(workspaceQueryKeys.detail("workspace-1"), { id: "workspace-1" });
    queryClient.setQueryData(authQueryKeys.dashboardSummary(workspaceScope), { scope: "workspace" });
    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(userQueryKeys.roleCandidates(workspaceScope), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.availableRoles(workspaceScope), []);

    const { result } = renderHook(() => useEditWorkspace(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.editWorkspace({
        assignedRoleIds: [],
        description: "",
        id: "workspace-1",
        isActive: true,
        maxActiveUsers: null,
        name: "Workspace A"
      });
    });

    expect(queryClient.getQueryState(workspaceQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(workspaceQueryKeys.detail("workspace-1"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(authQueryKeys.dashboardSummary(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.roleCandidates(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.availableRoles(workspaceScope))?.isInvalidated).toBe(true);
  });
});
