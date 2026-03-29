import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import * as roleAssignmentApi from "../../role-assignments/api/roleAssignmentsApi";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import { userQueryKeys } from "../queries/userQueryKeys";
import { useSaveUserAssignments } from "./useSaveUserAssignments";

vi.mock("../../role-assignments/api/roleAssignmentsApi", async () => {
  const actual = await vi.importActual<typeof import("../../role-assignments/api/roleAssignmentsApi")>("../../role-assignments/api/roleAssignmentsApi");

  return {
    ...actual,
    createUserRoleAssignment: vi.fn(),
    editUserRoleAssignment: vi.fn()
  };
});

describe("useSaveUserAssignments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not invalidate queries when assignments do not change", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(userQueryKeys.userAssignments("user-1"), []);
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: "user-1" });

    const { result } = renderHook(() => useSaveUserAssignments(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.saveUserAssignments({
        assignments: [
          {
            description: "Assigned",
            id: "assignment-1",
            isActive: true,
            roleId: "role-1",
            roleName: "Administrator",
            roleNormalizedName: "ADMINISTRATOR",
            userId: "user-1",
            userName: "testuser01"
          }
        ],
        selectedRoleIds: ["role-1"],
        userId: "user-1"
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(userQueryKeys.userAssignments("user-1"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(false);
  });

  it("invalidates only the affected user list and auth cache after assignment changes", async () => {
    const queryClient = new QueryClient();
    vi.mocked(roleAssignmentApi.createUserRoleAssignment).mockResolvedValue({ id: "assignment-2" });

    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(userQueryKeys.userAssignments("user-1"), []);
    queryClient.setQueryData(userQueryKeys.roleCandidates(), []);
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: "user-1" });
    queryClient.setQueryData(roleAssignmentQueryKeys.availableRoles(), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.candidates(), []);

    const { result } = renderHook(() => useSaveUserAssignments(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.saveUserAssignments({
        assignments: [],
        selectedRoleIds: ["role-1"],
        userId: "user-1"
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.userAssignments("user-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.roleCandidates())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.availableRoles())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.candidates())?.isInvalidated).toBe(false);
  });

  it("does not invalidate the current-user query when assignment changes affect a different user", async () => {
    const queryClient = new QueryClient();
    vi.mocked(roleAssignmentApi.createUserRoleAssignment).mockResolvedValue({ id: "assignment-2" });

    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(userQueryKeys.userAssignments("user-2"), []);
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: "user-1" });

    const { result } = renderHook(() => useSaveUserAssignments(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.saveUserAssignments({
        assignments: [],
        selectedRoleIds: ["role-1"],
        userId: "user-2"
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.userAssignments("user-2"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(false);
  });
});
