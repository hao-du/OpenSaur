import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../../app/providers/AppProviders";
import { WorkspaceFiltersDrawer } from "./WorkspaceFiltersDrawer";

function renderDrawer(onApply: (values: { search: string; status: "active" | "all" | "inactive"; }) => Promise<void> | void = vi.fn()) {
  return render(
    <AppProviders>
      <WorkspaceFiltersDrawer
        initialValues={{ search: "", status: "all" }}
        isOpen
        onApply={onApply}
        onClose={vi.fn()}
      />
    </AppProviders>
  );
}

describe("WorkspaceFiltersDrawer", () => {
  it("shows a busy apply action while filters are being applied", async () => {
    let resolveApply: (() => void) | null = null;
    const onApply = vi.fn(() => new Promise<void>(resolve => {
      resolveApply = resolve;
    }));

    renderDrawer(onApply);

    fireEvent.change(screen.getByRole("textbox", { name: /search workspaces/i }), {
      target: { value: "part" }
    });
    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const applyButton = screen.getByRole("button", { name: /applying filters/i });

      expect((applyButton as HTMLButtonElement).disabled).toBe(true);
      expect(applyButton.getAttribute("aria-busy")).toBe("true");
    });

    resolveApply?.();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply filters/i })).toBeDefined();
    });
  });
});
