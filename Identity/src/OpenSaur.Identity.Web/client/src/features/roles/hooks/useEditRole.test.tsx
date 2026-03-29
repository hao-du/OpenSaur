import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { userQueryKeys } from "../../users/queries/userQueryKeys";
import * as roleApi from "../api/rolesApi";
import { roleQueryKeys } from "../queries/roleQueryKeys";
import { useEditRole } from "./useEditRole";

vi.mock("../api/rolesApi", async () => {
  const actual = await vi.importActual<typeof import("../api/rolesApi")>("../api/rolesApi");

  return {
    ...actual,
    editRole: vi.fn()
  };
});

describe("useEditRole", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("invalidates the roles list without refetching permissions", async () => {
    const queryClient = new QueryClient();
    vi.mocked(roleApi.editRole).mockResolvedValue(undefined);
    const workspaceScope = {
      isImpersonating: true,
      userId: "testuser01",
      workspaceName: "Test Workspace 1"
    };

    queryClient.setQueryData(roleQueryKeys.list(), []);
    queryClient.setQueryData(roleQueryKeys.detail("role-1"), { id: "role-1" });
    queryClient.setQueryData(roleQueryKeys.permissions(), []);
    queryClient.setQueryData(authQueryKeys.dashboardSummary(workspaceScope), { scope: "workspace" });
    queryClient.setQueryData(userQueryKeys.roleCandidates(workspaceScope), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.availableRoles(workspaceScope), []);

    const { result } = renderHook(() => useEditRole(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.editRole({
        description: "",
        id: "role-1",
        isActive: true,
        name: "Administrator",
        permissionCodeIds: []
      });
    });

    expect(queryClient.getQueryState(roleQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(roleQueryKeys.detail("role-1"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleQueryKeys.permissions())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(authQueryKeys.dashboardSummary(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.roleCandidates(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.availableRoles(workspaceScope))?.isInvalidated).toBe(true);
  });
});
