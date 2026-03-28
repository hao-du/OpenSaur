import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../app/providers/AppProviders";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders an intentionally empty dashboard workspace", () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/"]}>
          <HomePage />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByRole("heading", { level: 1, name: /dashboard/i })).toBeDefined();
    expect(screen.queryByText(/hosted auth session/i)).toBeNull();
    expect(screen.queryByText(/session details/i)).toBeNull();
  });
});
