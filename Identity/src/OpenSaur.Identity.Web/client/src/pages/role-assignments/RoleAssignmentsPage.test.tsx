import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { RoleAssignmentsPage } from "./RoleAssignmentsPage";

const useCurrentUserStateMock = vi.fn();
const useCurrentUserQueryMock = vi.fn();
const useLogoutMock = vi.fn();
const useAvailableRolesQueryMock = vi.fn();
const useRoleAssignmentsQueryMock = vi.fn();
const useAssignmentCandidatesQueryMock = vi.fn();
const useSaveRoleAssignmentsMock = vi.fn();

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserQuery: () => useCurrentUserQueryMock(),
    useCurrentUserState: () => useCurrentUserStateMock(),
    useLogout: () => useLogoutMock()
  };
});

vi.mock("../../features/role-assignments/hooks", () => ({
  useAssignmentCandidatesQuery: () => useAssignmentCandidatesQueryMock(),
  useAvailableRolesQuery: () => useAvailableRolesQueryMock(),
  useRoleAssignmentsQuery: (...args: unknown[]) => useRoleAssignmentsQueryMock(...args),
  useSaveRoleAssignments: () => useSaveRoleAssignmentsMock()
}));

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/role-assignments"]}>
        <RoleAssignmentsPage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("RoleAssignmentsPage", () => {
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
    useCurrentUserStateMock.mockReturnValue({
      data: {
        id: "user-1",
        isImpersonating: true,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "finance.superadmin",
        workspaceName: "Finance"
      },
      isPending: false
    });
    useAvailableRolesQueryMock.mockReturnValue({
      data: [
        {
          description: "Administrators manage identity configuration.",
          id: "role-1",
          isActive: true,
          name: "Administrator",
          normalizedName: "ADMINISTRATOR"
        },
        {
          description: "Auditors review access records.",
          id: "role-2",
          isActive: false,
          name: "Auditor",
          normalizedName: "AUDITOR"
        }
      ],
      isError: false,
      isLoading: false,
      refetch: vi.fn()
    });
    useRoleAssignmentsQueryMock.mockReturnValue({
      data: [
        {
          description: "Assigned to FinanceAdmin",
          id: "assignment-1",
          isActive: true,
          userId: "user-1",
          userName: "FinanceAdmin",
          workspaceId: "workspace-1",
          workspaceName: "Finance"
        }
      ],
      isError: false,
      isLoading: false
    });
    useAssignmentCandidatesQueryMock.mockReturnValue({
      data: [
        {
          email: "finance.admin@example.com",
          userId: "user-1",
          userName: "FinanceAdmin",
          workspaceId: "workspace-1",
          workspaceName: "Finance"
        },
        {
          email: "finance.user@example.com",
          userId: "user-2",
          userName: "FinanceUser",
          workspaceId: "workspace-1",
          workspaceName: "Finance"
        }
      ],
      isError: false,
      isLoading: false
    });
    useSaveRoleAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveRoleAssignments: vi.fn()
    });
  });

  it("renders workspace-scoped role assignments without global role-definition actions", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /role assignments/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^filter$/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /^create$/i })).toBeNull();
    expect(screen.getByText("Administrator")).toBeDefined();
    expect(screen.queryByText("Auditor")).toBeNull();
    expect(screen.getByRole("button", { name: /edit assignments/i })).toBeDefined();
  });

  it("opens an assigned-users editor scoped to the impersonated workspace", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit assignments/i }));

    expect(screen.getByRole("heading", { level: 2, name: /assigned users/i })).toBeDefined();
    expect(screen.queryByText(/^role$/i)).toBeNull();
    expect(screen.queryByText(/^permissions$/i)).toBeNull();
    expect(screen.getByText(/financeadmin/i)).toBeDefined();

    const userInput = screen.getByPlaceholderText(/search active users/i);
    fireEvent.mouseDown(userInput);

    expect(screen.getByRole("option", { name: /financeuser/i })).toBeDefined();
    expect(screen.getAllByText(/^finance$/i).length).toBeGreaterThan(0);
  });

  it("saves assignment changes for the selected role", async () => {
    const saveRoleAssignments = vi.fn().mockResolvedValue(undefined);

    useSaveRoleAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveRoleAssignments
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /edit assignments/i }));

    const userInput = screen.getByPlaceholderText(/search active users/i);
    fireEvent.input(userInput, { target: { value: "FinanceUser" } });
    fireEvent.click(screen.getByRole("option", { name: /financeuser/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(saveRoleAssignments).toHaveBeenCalledWith({
        assignments: [
          {
            description: "Assigned to FinanceAdmin",
            id: "assignment-1",
            isActive: true,
            userId: "user-1",
            userName: "FinanceAdmin",
            workspaceId: "workspace-1",
            workspaceName: "Finance"
          }
        ],
        roleId: "role-1",
        selectedUserIds: ["user-1", "user-2"]
      });
    });
  });

  it("filters the role assignments list by status and keeps the filter after saving", async () => {
    const saveRoleAssignments = vi.fn().mockResolvedValue(undefined);

    useSaveRoleAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveRoleAssignments
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

    fireEvent.click(screen.getByRole("button", { name: /edit assignments/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(saveRoleAssignments).toHaveBeenCalled();
    });

    expect(screen.getByText("Auditor")).toBeDefined();
    expect(screen.queryByText("Administrator")).toBeNull();
  });
});
