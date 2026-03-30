import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../../app/providers/AppProviders";
import { RolePreviewList } from "./RolePreviewList";

describe("RolePreviewList", () => {
  it("renders the overflow trigger as a chip-styled button", async () => {
    render(
      <AppProviders>
        <RolePreviewList
          roles={[
            { id: "role-1", name: "Administrator" },
            { id: "role-2", name: "Content Writer" },
            { id: "role-3", name: "Reviewer" }
          ]}
        />
      </AppProviders>
    );

    const overflowTrigger = screen.getByRole("button", { name: /show 1 more role/i });

    expect(overflowTrigger.className).toContain("MuiChip-root");

    fireEvent.click(overflowTrigger);

    await waitFor(() => {
      expect(screen.getByText("Reviewer")).toBeDefined();
    });
  });
});
