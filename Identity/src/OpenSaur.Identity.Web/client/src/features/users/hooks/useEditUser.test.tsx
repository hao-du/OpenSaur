import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { authQueryKeys } from "../../auth/queries/authQueryKeys";
import { roleAssignmentQueryKeys } from "../../role-assignments/queries/roleAssignmentQueryKeys";
import * as userApi from "../api/usersApi";
import { userQueryKeys } from "../queries/userQueryKeys";
import { useEditUser } from "./useEditUser";

vi.mock("../api/usersApi", async () => {
  const actual = await vi.importActual<typeof import("../api/usersApi")>("../api/usersApi");

  return {
    ...actual,
    editUser: vi.fn()
  };
});

describe("useEditUser", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("invalidates the users list and current-user query without refetching unrelated user queries", async () => {
    const queryClient = new QueryClient();
    vi.mocked(userApi.editUser).mockResolvedValue(undefined);
    const workspaceScope = {
      isImpersonating: true,
      userId: "testuser01",
      workspaceName: "Test Workspace 1"
    };

    queryClient.setQueryData(authQueryKeys.currentUser(), {
      firstName: "",
      id: "user-1",
      lastName: "",
      userName: "testuser01"
    });
    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(userQueryKeys.detail("user-1"), {
      id: "user-1"
    });
    queryClient.setQueryData(authQueryKeys.dashboardSummary(workspaceScope), { scope: "workspace" });
    queryClient.setQueryData(userQueryKeys.roleCandidates(), []);
    queryClient.setQueryData(roleAssignmentQueryKeys.candidates(workspaceScope), []);

    const { result } = renderHook(() => useEditUser(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.editUser({
        description: "",
        email: "testuser01@gmail.com",
        firstName: "Test",
        id: "user-1",
        isActive: true,
        lastName: "Example",
        userName: "testuser01",
        userSettings: "{}"
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.dashboardSummary(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(userQueryKeys.detail("user-1"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(userQueryKeys.roleCandidates())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.candidates(workspaceScope))?.isInvalidated).toBe(true);
  });

  it("does not invalidate the current-user query when editing a different user", async () => {
    const queryClient = new QueryClient();
    vi.mocked(userApi.editUser).mockResolvedValue(undefined);
    const workspaceScope = {
      isImpersonating: true,
      userId: "testuser01",
      workspaceName: "Test Workspace 1"
    };

    queryClient.setQueryData(authQueryKeys.currentUser(), {
      firstName: "Current",
      id: "user-1",
      lastName: "User",
      userName: "current.user"
    });
    queryClient.setQueryData(userQueryKeys.list(), []);
    queryClient.setQueryData(authQueryKeys.dashboardSummary(workspaceScope), { scope: "workspace" });
    queryClient.setQueryData(roleAssignmentQueryKeys.candidates(workspaceScope), []);

    const { result } = renderHook(() => useEditUser(), {
      wrapper: ({ children }) => (
        <AppProviders queryClient={queryClient}>{children}</AppProviders>
      )
    });

    await act(async () => {
      await result.current.editUser({
        description: "",
        email: "other.user@gmail.com",
        firstName: "Other",
        id: "user-2",
        isActive: true,
        lastName: "User",
        userName: "other.user",
        userSettings: "{}"
      });
    });

    expect(queryClient.getQueryState(userQueryKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(authQueryKeys.currentUser())?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(authQueryKeys.dashboardSummary(workspaceScope))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(roleAssignmentQueryKeys.candidates(workspaceScope))?.isInvalidated).toBe(true);
  });
});
