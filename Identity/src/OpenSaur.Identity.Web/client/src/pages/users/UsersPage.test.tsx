import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { UsersPage } from "./UsersPage";

const useCurrentUserStateMock = vi.fn();
const useCurrentUserQueryMock = vi.fn();
const useLogoutMock = vi.fn();
const useUsersQueryMock = vi.fn();
const useUserQueryMock = vi.fn();
const useCreateUserMock = vi.fn();
const useEditUserMock = vi.fn();
const useUserAssignmentsQueryMock = vi.fn();
const useRoleCandidatesQueryMock = vi.fn();
const useSaveUserAssignmentsMock = vi.fn();

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserQuery: () => useCurrentUserQueryMock(),
    useCurrentUserState: () => useCurrentUserStateMock(),
    useLogout: () => useLogoutMock()
  };
});

vi.mock("../../features/users/hooks", () => ({
  useCreateUser: () => useCreateUserMock(),
  useEditUser: () => useEditUserMock(),
  useRoleCandidatesQuery: () => useRoleCandidatesQueryMock(),
  useSaveUserAssignments: () => useSaveUserAssignmentsMock(),
  useUserAssignmentsQuery: (...args: unknown[]) => useUserAssignmentsQueryMock(...args),
  useUserQuery: (...args: unknown[]) => useUserQueryMock(...args),
  useUsersQuery: () => useUsersQueryMock()
}));

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/users"]}>
        <UsersPage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("UsersPage", () => {
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
        canManageUsers: true,
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["ADMINISTRATOR"],
        userName: "workspace.admin",
        workspaceName: "Operations"
      },
      isPending: false
    });
    useUsersQueryMock.mockReturnValue({
      data: [
        {
          email: "alex@example.com",
          id: "user-1",
          isActive: true,
          requirePasswordChange: false,
          roles: [
            {
              assignmentId: "assignment-1",
              id: "role-1",
              name: "Administrator",
              normalizedName: "ADMINISTRATOR"
            }
          ],
          userName: "Alex"
        },
        {
          email: "inactive@example.com",
          id: "user-2",
          isActive: false,
          requirePasswordChange: true,
          roles: [],
          userName: "InactiveUser"
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
    useUserAssignmentsQueryMock.mockReturnValue({
      data: [],
      isLoading: false
    });
    useRoleCandidatesQueryMock.mockReturnValue({
      data: [
        {
          description: "Workspace administrators",
          roleId: "role-1",
          roleName: "Administrator",
          roleNormalizedName: "ADMINISTRATOR"
        }
      ],
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
    useSaveUserAssignmentsMock.mockReturnValue({
      errorMessage: null,
      isSaving: false,
      resetError: vi.fn(),
      saveUserAssignments: vi.fn()
    });
  });

  it("renders the workspace-scoped users list with create and filter actions", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /users/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^filter$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getByText("Alex")).toBeDefined();
    expect(screen.queryByText("InactiveUser")).toBeNull();
  });

  it("opens a user editor with user and assigned roles sections", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(screen.getByRole("heading", { level: 2, name: /create user/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /user name/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeDefined();
    expect(screen.getByText(/^assigned roles$/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDefined();
  });

  it("does not offer the reserved Super Administrator role in assigned roles", async () => {
    useRoleCandidatesQueryMock.mockReturnValue({
      data: [
        {
          description: "Workspace administrators",
          roleId: "role-1",
          roleName: "Administrator",
          roleNormalizedName: "ADMINISTRATOR"
        },
        {
          description: "Reserved platform role",
          roleId: "role-2",
          roleName: "Super Administrator",
          roleNormalizedName: "SUPERADMINISTRATOR"
        }
      ],
      isLoading: false
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /role/i }));

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /administrator/i })).toBeDefined();
    });

    expect(screen.queryByRole("option", { name: /super administrator/i })).toBeNull();
  });

  it("keeps the active filter after saving a user", async () => {
    const createUser = vi.fn().mockResolvedValue({ id: "user-3" });

    useCreateUserMock.mockReturnValue({
      createUser,
      errorMessage: null,
      isCreating: false,
      resetError: vi.fn()
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /user name/i }), {
      target: { value: "Jamie" }
    });
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "jamie@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: "P@ssword1" }
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalled();
    });

    const body = screen.getByRole("main");
    expect(within(body).getByText("Alex")).toBeDefined();
    expect(within(body).queryByText("InactiveUser")).toBeNull();
  });
});
