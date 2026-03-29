import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { ProfilePage } from "./ProfilePage";

const useCurrentUserStateMock = vi.fn();

vi.mock("../../features/auth/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../features/auth/hooks")>("../../features/auth/hooks");

  return {
    ...actual,
    useCurrentUserState: () => useCurrentUserStateMock()
  };
});

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={["/profile"]}>
        <ProfilePage />
      </MemoryRouter>
    </AppProviders>
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    useCurrentUserStateMock.mockReturnValue({
      data: {
        canManageUsers: true,
        email: "hao@example.com",
        firstName: "Hao",
        id: "user-1",
        isImpersonating: false,
        lastName: "Du",
        requirePasswordChange: false,
        roles: ["ADMINISTRATOR"],
        userName: "haodu",
        workspaceName: "Operations"
      },
      isPending: false
    });
  });

  it("renders first and last name fields", () => {
    renderPage();

    expect(screen.getByText(/^first name$/i)).toBeDefined();
    expect(screen.getByText("Hao")).toBeDefined();
    expect(screen.getByText(/^last name$/i)).toBeDefined();
    expect(screen.getByText("Du")).toBeDefined();
  });
});
