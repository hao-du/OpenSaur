import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { RolesPage } from "./RolesPage";

const useCurrentUserStateMock = vi.fn();
const useCurrentUserQueryMock = vi.fn();
const useLogoutMock = vi.fn();
const useRolesQueryMock = vi.fn();
const useRoleQueryMock = vi.fn();
const usePermissionsQueryMock = vi.fn();
const useCreateRoleMock = vi.fn();
const useEditRoleMock = vi.fn();

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserQuery: () => useCurrentUserQueryMock(),
    useCurrentUserState: () => useCurrentUserStateMock(),
    useLogout: () => useLogoutMock()
  };
});

vi.mock("../../features/roles/hooks", () => ({
  useCreateRole: () => useCreateRoleMock(),
  useEditRole: () => useEditRoleMock(),
  usePermissionsQuery: () => usePermissionsQueryMock(),
  useRoleQuery: (...args: unknown[]) => useRoleQueryMock(...args),
  useRolesQuery: () => useRolesQueryMock()
}));

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/roles"]}>
        <RolesPage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("RolesPage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    vi.resetAllMocks();

    useCurrentUserQueryMock.mockReturnValue({
      clearCurrentUser: vi.fn(),
      fetchCurrentUser: vi.fn()
    });
    useLogoutMock.mockReturnValue({
      isLoggingOut: false,
      logout: vi.fn()
    });
    useRolesQueryMock.mockReturnValue({
      data: [
        {
          description: "Administrators manage identity configuration.",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        },
        {
          description: "Super administrators manage all workspaces.",
          id: "role-2",
          isActive: true,
          name: "SuperAdministrator",
          normalizedName: "SUPERADMINISTRATOR"
        },
        {
          description: "Auditors review access records.",
          id: "role-3",
          isActive: false,
          name: "Auditor",
          normalizedName: "AUDITOR"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useRoleQueryMock.mockReturnValue({
      data: null,
      isLoading: false
    });
    usePermissionsQueryMock.mockReturnValue({
      data: [
        {
          code: "Administrator_CanManage",
          codeId: 1,
          description: "Manage administrator data",
          id: "permission-1",
          isActive: true,
          name: "Can Manage",
          permissionScopeId: "scope-1",
          permissionScopeName: "Administrator"
        }
      ],
      isError: false,
      isLoading: false
    });
    useCreateRoleMock.mockReturnValue({
      createRole: vi.fn(),
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });
    useEditRoleMock.mockReturnValue({
      editRole: vi.fn(),
      errorMessage: null,
      isEditing: false,
      resetError: vi.fn()
    });
  });

  it("shows the global roles list with create and edit actions for real super administrators", () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });

    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /roles/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^filter$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getByText("Administrator")).toBeDefined();
    expect(screen.queryByText("Auditor")).toBeNull();
    expect(screen.getAllByRole("button", { name: /edit role/i })).toHaveLength(1);
  });

  it("does not show an edit action for the reserved SuperAdministrator role", () => {
    useRolesQueryMock.mockReturnValue({
      data: [
        {
          description: "Administrators manage identity configuration.",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        },
        {
          description: "Super administrators manage all workspaces.",
          id: "role-2",
          isActive: true,
          name: "Super Administrator",
          normalizedName: "SUPER ADMINISTRATOR"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });

    renderPage();

    expect(screen.getByText("Super Administrator")).toBeDefined();
    expect(screen.getAllByRole("button", { name: /edit role/i })).toHaveLength(1);
  });

  it("opens a role editor with role and permissions sections for real super administrators", async () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(screen.getByRole("heading", { level: 2, name: /create role/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /role name/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /description/i })).toBeDefined();
    expect(screen.getByRole("heading", { level: 6, name: /^permissions$/i })).toBeDefined();
    expect(screen.queryByText(/^assigned users$/i)).toBeNull();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDefined();
  });

  it("shows global role-definition actions for impersonated super administrators", () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-2",
        isImpersonating: true,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "finance.superadmin",
        workspaceName: "Finance"
      },
      isPending: false
    });

    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /roles/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getAllByRole("button", { name: /edit role/i })).toHaveLength(1);
  });

  it("saves a new role with selected permissions", async () => {
    const createRole = vi.fn().mockResolvedValue({ id: "role-3" });

    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });
    useCreateRoleMock.mockReturnValue({
      createRole,
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /role name/i }), {
      target: { value: "OperationsManager" }
    });
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "Manages operations users." }
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /can manage/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createRole).toHaveBeenCalledWith({
        description: "Manages operations users.",
        name: "OperationsManager",
        permissionCodeIds: [1]
      });
    });
  });

  it("filters the role list by status and keeps the filter after saving", async () => {
    const createRole = vi.fn().mockResolvedValue({ id: "role-4" });

    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });
    useCreateRoleMock.mockReturnValue({
      createRole,
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^filter$/i }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /role status/i }));
    fireEvent.click(screen.getByRole("option", { name: /^inactive$/i }));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(screen.getByText("Auditor")).toBeDefined();
    });
    expect(screen.queryByText("Administrator")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /role name/i }), {
      target: { value: "OperationsManager" }
    });
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "Manages operations users." }
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createRole).toHaveBeenCalled();
    });

    const table = screen.getByRole("table");

    expect(within(table).getByText("Auditor")).toBeDefined();
    expect(within(table).queryByText("Administrator")).toBeNull();
  });
});
