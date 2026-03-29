import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { HomePage } from "./HomePage";

const useCurrentUserStateMock = vi.fn();
const useDashboardSummaryQueryMock = vi.fn();

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserState: () => useCurrentUserStateMock(),
    useDashboardSummaryQuery: () => useDashboardSummaryQueryMock()
  };
});

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/"]}>
        <HomePage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders global summary blocks for real super-administrator sessions", () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        canManageUsers: false,
        id: "user-1",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["SUPERADMINISTRATOR"],
        userName: "SystemAdministrator",
        workspaceName: "All workspaces"
      },
      isPending: false
    });
    useDashboardSummaryQueryMock.mockReturnValue({
      data: {
        activeUserCount: 15,
        activeWorkspaceCount: 3,
        availableRoleCount: 6,
        inactiveUserCount: 2,
        maxActiveUsers: null,
        scope: "global",
        workspaceCount: 4,
        workspaceName: null
      },
      isError: false,
      isLoading: false
    });

    renderPage();

    expect(screen.getByText(/total workspaces/i)).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
    expect(screen.getByText(/active users/i)).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText(/roles/i)).toBeDefined();
    expect(screen.getByText(/quick actions/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /open workspaces/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /manage role catalog/i })).toBeDefined();
  });

  it("renders workspace summary blocks with capacity usage for workspace-scoped sessions", () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        canManageUsers: true,
        id: "user-2",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["ADMINISTRATOR"],
        userName: "workspace.admin",
        workspaceName: "Operations"
      },
      isPending: false
    });
    useDashboardSummaryQueryMock.mockReturnValue({
      data: {
        activeUserCount: 8,
        activeWorkspaceCount: 1,
        availableRoleCount: 3,
        inactiveUserCount: 2,
        maxActiveUsers: 10,
        scope: "workspace",
        workspaceCount: 1,
        workspaceName: "Operations"
      },
      isError: false,
      isLoading: false
    });

    renderPage();

    expect(screen.getByText(/operations/i)).toBeDefined();
    expect(screen.queryByText(/workspace context/i)).toBeNull();
    expect(screen.getByText(/license usage/i)).toBeDefined();
    expect(screen.getByText("8 / 10")).toBeDefined();
    expect(screen.getByText(/inactive users/i)).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByRole("button", { name: /open users/i })).toBeDefined();
  });

  it("hides workspace quick actions when the session cannot manage users", () => {
    useCurrentUserStateMock.mockReturnValue({
      data: {
        canManageUsers: false,
        id: "user-3",
        isImpersonating: false,
        requirePasswordChange: false,
        roles: ["USER"],
        userName: "workspace.user",
        workspaceName: "Operations"
      },
      isPending: false
    });
    useDashboardSummaryQueryMock.mockReturnValue({
      data: {
        activeUserCount: 8,
        activeWorkspaceCount: 1,
        availableRoleCount: 3,
        inactiveUserCount: 2,
        maxActiveUsers: 10,
        scope: "workspace",
        workspaceCount: 1,
        workspaceName: "Operations"
      },
      isError: false,
      isLoading: false
    });

    renderPage();

    expect(screen.getByText(/license usage/i)).toBeDefined();
    expect(screen.queryByText(/quick actions/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /open users/i })).toBeNull();
  });
});
