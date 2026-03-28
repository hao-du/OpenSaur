import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { WorkspacesPage } from "./WorkspacesPage";
import type { WorkspaceSummary } from "../../features/workspaces/types";

const useWorkspacesQueryMock = vi.fn();
const useCreateWorkspaceMock = vi.fn();
const useEditWorkspaceMock = vi.fn();
const useWorkspaceQueryMock = vi.fn();
const useCurrentUserStateMock = vi.fn();
const useCurrentUserQueryMock = vi.fn();
const useLogoutMock = vi.fn();
const useImpersonationOptionsQueryMock = vi.fn();
const useStartImpersonationMock = vi.fn();

vi.mock("../../features/workspaces/hooks", () => ({
  useCreateWorkspace: () => useCreateWorkspaceMock(),
  useEditWorkspace: () => useEditWorkspaceMock(),
  useWorkspaceQuery: (...args: unknown[]) => useWorkspaceQueryMock(...args),
  useWorkspacesQuery: () => useWorkspacesQueryMock()
}));

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserQuery: () => useCurrentUserQueryMock(),
    useCurrentUserState: () => useCurrentUserStateMock(),
    useImpersonationOptionsQuery: (...args: unknown[]) => useImpersonationOptionsQueryMock(...args),
    useLogout: () => useLogoutMock(),
    useStartImpersonation: () => useStartImpersonationMock()
  };
});

const workspaces: WorkspaceSummary[] = [
  {
    description: "Primary staff workspace",
    id: "workspace-1",
    isActive: true,
    name: "Operations"
  },
  {
    description: "Archived partner workspace",
    id: "workspace-2",
    isActive: false,
    name: "Partners"
  }
];

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/workspaces"]}>
        <WorkspacesPage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("WorkspacesPage", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    vi.resetAllMocks();

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
    useCurrentUserQueryMock.mockReturnValue({
      clearCurrentUser: vi.fn(),
      fetchCurrentUser: vi.fn().mockResolvedValue({
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      })
    });
    useLogoutMock.mockReturnValue({
      isLoggingOut: false,
      logout: vi.fn()
    });
    useImpersonationOptionsQueryMock.mockReturnValue({
      data: null,
      isError: false,
      isLoading: false
    });
    useStartImpersonationMock.mockReturnValue({
      errorMessage: null,
      isStartingImpersonation: false,
      resetError: vi.fn(),
      startImpersonation: vi.fn()
    });
    useWorkspacesQueryMock.mockReturnValue({
      data: workspaces,
      error: null,
      isError: false,
      isLoading: false
    });
    useWorkspaceQueryMock.mockReturnValue({
      data: null,
      error: null,
      isError: false,
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
  });

  it("defaults the workspace list to active workspaces", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /workspace/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^create$/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /filter/i })).toBeDefined();
    expect(screen.getByRole("cell", { name: /operations/i })).toBeDefined();
    expect(screen.queryByRole("cell", { name: /partners/i })).toBeNull();
    expect(screen.getByText(/primary staff workspace/i)).toBeDefined();
    expect(screen.getAllByText(/^active$/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^inactive$/i)).toBeNull();
  });

  it("filters the rendered workspace list from the filter drawer", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    fireEvent.mouseDown(screen.getByLabelText(/workspace status/i));
    fireEvent.click(screen.getByRole("option", { name: /^all$/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /search workspaces/i }), {
      target: { value: "part" }
    });
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    return waitFor(() => {
      expect(screen.queryByRole("cell", { name: /operations/i })).toBeNull();
      expect(screen.getByRole("cell", { name: /partners/i })).toBeDefined();
    });
  });

  it("opens the create drawer from the primary action", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(screen.getByRole("heading", { level: 2, name: /create workspace/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /workspace name/i })).toBeDefined();
    expect(screen.getByRole("textbox", { name: /description/i })).toBeDefined();
    expect(screen.queryByRole("checkbox", { name: /workspace is active/i })).toBeNull();
    expect(screen.queryByText(/new workspaces start in the active state/i)).toBeNull();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDefined();
  });

  it("shows a busy create action while creating a workspace", () => {
    useCreateWorkspaceMock.mockReturnValue({
      createWorkspace: vi.fn(),
      errorMessage: null,
      isCreating: true,
      resetError: vi.fn()
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    const submitButton = screen.getByRole("button", { name: /^saving\.\.\.$/i });

    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    expect(submitButton.getAttribute("aria-busy")).toBe("true");
  });

  it("opens the edit drawer for the selected workspace row", () => {
    useWorkspaceQueryMock.mockReturnValue({
      data: workspaces[0],
      error: null,
      isError: false,
      isLoading: false
    });

    renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: /edit workspace/i })[0]);

    expect(screen.getByRole("heading", { level: 2, name: /edit workspace/i })).toBeDefined();
    expect((screen.getByRole("textbox", { name: /workspace name/i }) as HTMLInputElement).value).toBe("Operations");
    expect((screen.getByRole("checkbox", { name: /workspace is active/i }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDefined();
  });

  it("renders an intentional empty state when no workspaces are returned", () => {
    useWorkspacesQueryMock.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false
    });

    renderPage();

    expect(screen.getByText(/no workspaces yet/i)).toBeDefined();
    expect(screen.getByText(/create the first workspace/i)).toBeDefined();
  });

  it("filters the rendered workspace list by active state", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    fireEvent.mouseDown(screen.getByLabelText(/workspace status/i));
    fireEvent.click(screen.getByRole("option", { name: /^active$/i }));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    return waitFor(() => {
      expect(screen.getByRole("cell", { name: /operations/i })).toBeDefined();
      expect(screen.queryByRole("cell", { name: /partners/i })).toBeNull();
    });
  });

  it("keeps the selected filter after saving workspace changes", async () => {
    const editWorkspace = vi.fn().mockResolvedValue(undefined);

    useEditWorkspaceMock.mockReturnValue({
      editWorkspace,
      errorMessage: null,
      isEditing: false,
      resetError: vi.fn()
    });
    useWorkspaceQueryMock.mockReturnValue({
      data: workspaces[1],
      error: null,
      isError: false,
      isLoading: false
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    fireEvent.mouseDown(screen.getByLabelText(/workspace status/i));
    fireEvent.click(screen.getByRole("option", { name: /^inactive$/i }));
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(screen.queryByRole("cell", { name: /operations/i })).toBeNull();
      expect(screen.getByRole("cell", { name: /partners/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /edit workspace/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(editWorkspace).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByRole("cell", { name: /operations/i })).toBeNull();
      expect(screen.getByRole("cell", { name: /partners/i })).toBeDefined();
    });
  });

  it("renders a retryable error state when the workspace query fails", () => {
    useWorkspacesQueryMock.mockReturnValue({
      data: [],
      error: new Error("boom"),
      isError: true,
      isLoading: false,
      refetch: vi.fn()
    });

    renderPage();

    expect(screen.getByText(/couldn't load the workspace list/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("shows workspace users and super administrators in a searchable login-as picker", async () => {
    const startImpersonation = vi.fn().mockResolvedValue({
      accessToken: "impersonated-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    useImpersonationOptionsQueryMock.mockReturnValue({
      data: {
        users: [
          {
            email: "system.administrator@example.com",
            id: "user-1",
            userName: "SystemAdministrator"
          },
          {
            email: "finance.admin@example.com",
            id: "user-99",
            userName: "FinanceAdmin"
          }
        ],
        workspaceId: "workspace-1",
        workspaceName: "Operations"
      },
      isError: false,
      isLoading: false
    });
    useStartImpersonationMock.mockReturnValue({
      errorMessage: null,
      isStartingImpersonation: false,
      resetError: vi.fn(),
      startImpersonation
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /login as/i }));

    expect(screen.getByRole("heading", { level: 2, name: /login as/i })).toBeDefined();
    const userInput = screen.getByPlaceholderText(/search users/i);

    fireEvent.mouseDown(userInput);
    expect(screen.getByRole("option", { name: /systemadministrator/i })).toBeDefined();
    expect(screen.getByRole("option", { name: /financeadmin/i })).toBeDefined();

    fireEvent.input(userInput, { target: { value: "finance" } });
    expect(screen.getByRole("option", { name: /financeadmin/i })).toBeDefined();

    fireEvent.click(screen.getByRole("option", { name: /financeadmin/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(startImpersonation).toHaveBeenCalledWith({
        userId: "user-99",
        workspaceId: "workspace-1"
      });
    });
  });
});
