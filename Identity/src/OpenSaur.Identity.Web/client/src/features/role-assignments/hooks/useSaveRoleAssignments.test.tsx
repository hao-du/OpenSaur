import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import * as roleAssignmentApi from "../api/roleAssignmentsApi";
import { roleAssignmentQueryKeys } from "../queries/roleAssignmentQueryKeys";
import { useSaveRoleAssignments } from "./useSaveRoleAssignments";
import { userQueryKeys } from "../../users/queries/userQueryKeys";

vi.mock("../api/roleAssignmentsApi", async () => {
  const actual = await vi.importActual<typeof import("../api/roleAssignmentsApi")>("../api/roleAssignmentsApi");

  return {
    ...actual,
    createUserRoleAssignment: vi.fn(),
    editUserRoleAssignment: vi.fn()
  };
});

describe("useSaveRoleAssignments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not invalidate the current-user query when role assignments change for other users", async () => {
    const queryClient = new QueryClient();
    vi.mocked(roleAssignmentApi.createUserRoleAssignment).mockResolvedValue({ id: "assignment-1" });

    queryClient.setQueryData(roleAssignmentQueryKeys.detail("role-1"), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.availableRoles(), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.candidates(), []);
    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: "user-1" });

    const { result } = renderHook(() => useSaveRoleAssignments(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.saveRoleAssignments({
        assignments: [],
        roleId: "role-1",
        selectedUserIds: ["user-2"]
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.detail("role-1"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.availableRoles())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.candidates())?.isInvalidated).toBe(false);
  });

  it("invalidates the current-user query when role assignments affect the signed-in user", async () => {
    const queryClient = new QueryClient();
    vi.mocked(roleAssignmentApi.createUserRoleAssignment).mockResolvedValue({ id: "assignment-1" });

    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: "user-1" });

    const { result } = renderHook(() => useSaveRoleAssignments(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.saveRoleAssignments({
        assignments: [],
        roleId: "role-1",
        selectedUserIds: ["user-1"]
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(true);
  });
});
