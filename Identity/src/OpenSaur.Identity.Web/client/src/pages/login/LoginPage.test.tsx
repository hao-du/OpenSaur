import { render, screen } from "@testing-library/react";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renders the sign in heading for the auth shell", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", {
        name: /sign in/i
      })
    ).toBeDefined();
  });
});
