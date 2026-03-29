import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AppProviders } from "../providers/AppProviders";
import * as authApi from "../../features/auth/api/authApi";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { appRoutes } from "./AppRouter";

const useWorkspacesQueryMock = vi.fn();
const useWorkspaceQueryMock = vi.fn();
const useCreateWorkspaceMock = vi.fn();
const useEditWorkspaceMock = vi.fn();
const useRolesQueryMock = vi.fn();
const useAvailableRolesQueryMock = vi.fn();
const useRoleAssignmentsQueryMock = vi.fn();
const useAssignmentCandidatesQueryMock = vi.fn();
const useSaveRoleAssignmentsMock = vi.fn();
const useUsersQueryMock = vi.fn();
const useUserQueryMock = vi.fn();
const useCreateUserMock = vi.fn();
const useEditUserMock = vi.fn();
const useUserAssignmentsQueryMock = vi.fn();
const useRoleCandidatesQueryMock = vi.fn();
const useSaveUserAssignmentsMock = vi.fn();

vi.mock("../../features/auth/api/authApi", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/api/authApi")>("../../features/auth/api/authApi");

  return {
    ...actual,
    getCurrentUser: vi.fn()
  };
});

vi.mock("../../features/workspaces/hooks", () => ({
  useCreateWorkspace: () => useCreateWorkspaceMock(),
  useEditWorkspace: () => useEditWorkspaceMock(),
  useWorkspaceQuery: (...args: unknown[]) => useWorkspaceQueryMock(...args),
  useWorkspacesQuery: () => useWorkspacesQueryMock()
}));

vi.mock("../../features/roles/hooks", () => ({
  useCreateRole: vi.fn(),
  useEditRole: vi.fn(),
  usePermissionsQuery: vi.fn(() => ({
    data: [],
    isLoading: false
  })),
  useRoleQuery: vi.fn(() => ({
    data: null,
    isLoading: false
  })),
  useRolesQuery: () => useRolesQueryMock()
}));

vi.mock("../../features/role-assignments/hooks", () => ({
  useAssignmentCandidatesQuery: () => useAssignmentCandidatesQueryMock(),
  useAvailableRolesQuery: () => useAvailableRolesQueryMock(),
  useRoleAssignmentsQuery: (...args: unknown[]) => useRoleAssignmentsQueryMock(...args),
  useSaveRoleAssignments: () => useSaveRoleAssignmentsMock()
}));

vi.mock("../../features/users/hooks", () => ({
  useCreateUser: () => useCreateUserMock(),
  useEditUser: () => useEditUserMock(),
  useRoleCandidatesQuery: () => useRoleCandidatesQueryMock(),
  useSaveUserAssignments: () => useSaveUserAssignmentsMock(),
  useUserAssignmentsQuery: (...args: unknown[]) => useUserAssignmentsQueryMock(...args),
  useUserQuery: (...args: unknown[]) => useUserQueryMock(...args),
  useUsersQuery: () => useUsersQueryMock()
}));

function setDesktopMode(isDesktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: isDesktop ? query.includes("min-width") : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  });
}

describe("AppRouter", () => {
  function createFutureExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
    vi.resetAllMocks();
    window.history.replaceState({}, "", "/");
    setDesktopMode(true);
    useWorkspacesQueryMock.mockReturnValue({
      data: [
        {
          description: "Primary staff workspace",
          id: "workspace-1",
          isActive: true,
          name: "Operations"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useWorkspaceQueryMock.mockReturnValue({
      data: null,
      isLoading: false
    });
    useCreateWorkspaceMock.mockReturnValue({
      createWorkspace: vi.fn(),
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });
    useEditWorkspaceMock.mockReturnValue({
      editWorkspace: vi.fn(),
      errorMessage: null,
      isEditing: false,
      resetError: vi.fn()
    });
    useRolesQueryMock.mockReturnValue({
      data: [
        {
          description: "Administrators manage identity configuration.",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useRoleAssignmentsQueryMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false
    });
    useAvailableRolesQueryMock.mockReturnValue({
      data: [
        {
          description: "Administrators manage identity configuration.",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useAssignmentCandidatesQueryMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false
    });
    useSaveRoleAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveRoleAssignments: vi.fn()
    });
    useUsersQueryMock.mockReturnValue({
      data: [
        {
          email: "alex@example.com",
          id: "user-1",
          isActive: true,
          requirePasswordChange: false,
          userName: "Alex",
          workspaceId: "workspace-1"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useUserQueryMock.mockReturnValue({
      data: null,
      isLoading: false
    });
    useCreateUserMock.mockReturnValue({
      createUser: vi.fn(),
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });
    useEditUserMock.mockReturnValue({
      editUser: vi.fn(),
      errorMessage: null,
      isEditing: false,
      resetError: vi.fn()
    });
    useUserAssignmentsQueryMock.mockReturnValue({
      data: [],
      isLoading: false
    });
    useRoleCandidatesQueryMock.mockReturnValue({
      data: [],
      isLoading: false
    });
    useSaveUserAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveUserAssignments: vi.fn()
    });
  });

  function renderRouter(initialEntry: string) {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [initialEntry]
    });

    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    );

    return router;
  }

  it("redirects all-workspaces sessions away from the users route", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "systemadministrator",
      workspaceName: "All workspaces"
    });
    renderRouter("/users");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    });

    expect(screen.queryByRole("heading", { level: 1, name: /users/i })).toBeNull();
  });

  it("renders the users management page for workspace-scoped sessions that can manage users", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: true,
      id: "user-1",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["ADMINISTRATOR"],
      userName: "workspace.admin",
      workspaceName: "Operations"
    } as any);
    renderRouter("/users");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /users/i })).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^users$/i }).getAttribute("aria-current")).toBe("page");
  });

  it("redirects non-super-administrators away from the roles route", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-2",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    });
    renderRouter("/roles");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    });

    expect(screen.queryByRole("heading", { level: 1, name: /roles/i })).toBeNull();
  });

  it("redirects non-super-administrators away from the role-assignments route", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-2",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["Administrator"],
      userName: "workspace.admin",
      workspaceName: "Protected workspace"
    });
    renderRouter("/role-assignments");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    });

    expect(screen.queryByRole("heading", { level: 1, name: /role assignments/i })).toBeNull();
  });

  it("renders the workspace management page for super administrators", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-3",
      isImpersonating: false,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "systemadministrator",
      workspaceName: "All workspaces"
    });
    renderRouter("/workspaces");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /workspace/i })).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getByRole("cell", { name: /operations/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^workspace$/i }).getAttribute("aria-current")).toBe("page");
  });

  it("redirects impersonated super administrators away from the workspace route", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-4",
      isImpersonating: true,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "finance.superadmin",
      workspaceName: "Finance"
    });
    renderRouter("/workspaces");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    });

    expect(screen.queryByRole("heading", { level: 1, name: /workspace/i })).toBeNull();
  });

  it("renders the role assignments page for impersonated super administrators", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "access-token",
      expiresAt: createFutureExpiry()
    });
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({
      canManageUsers: false,
      id: "user-5",
      isImpersonating: true,
      requirePasswordChange: false,
      roles: ["SUPERADMINISTRATOR"],
      userName: "finance.superadmin",
      workspaceName: "Finance"
    });
    renderRouter("/role-assignments");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /role assignments/i })).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /edit assignments/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /^role assignments$/i }).getAttribute("aria-current")).toBe("page");
  });
});
