import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers/AppProviders";
import { ShellAccountMenu } from "./ShellAccountMenu";

describe("ShellAccountMenu", () => {
  it("renders derived initials and opens the account menu", async () => {
    render(
      <AppProviders>
        <ShellAccountMenu
          isLoggingOut={false}
          onChangePassword={vi.fn()}
          onLogout={vi.fn()}
          userName="Hao Du"
        />
      </AppProviders>
    );

    expect(screen.getByText(/^hd$/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(await screen.findByRole("menuitem", { name: /my profile/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /change password/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeDefined();
  });

  it("invokes the change-password action", async () => {
    const onChangePassword = vi.fn();

    render(
      <AppProviders>
        <ShellAccountMenu
          isLoggingOut={false}
          onChangePassword={onChangePassword}
          onLogout={vi.fn()}
          userName="workspace.admin"
        />
      </AppProviders>
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /change password/i }));

    expect(onChangePassword).toHaveBeenCalledOnce();
  });

  it("shows the logout busy state", async () => {
    render(
      <AppProviders>
        <ShellAccountMenu
          isLoggingOut
          onChangePassword={vi.fn()}
          onLogout={vi.fn()}
          userName="workspace.admin"
        />
      </AppProviders>
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(await screen.findByRole("menuitem", { name: /signing out/i })).toBeDefined();
  });
});
