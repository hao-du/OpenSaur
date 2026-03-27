import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "@mui/material";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { UserRound } from "../../../shared/icons";
import { ControlledAuthTextField } from "./ControlledAuthTextField";
import { ControlledPasswordField } from "./ControlledPasswordField";

type TestFormValues = {
  password: string;
  userName: string;
};

function ControlledFieldsHarness() {
  const { control, handleSubmit } = useForm<TestFormValues>({
    defaultValues: {
      password: "",
      userName: ""
    }
  });

  return (
    <form onSubmit={handleSubmit(async () => {})}>
      <ControlledAuthTextField
        control={control}
        icon={<UserRound size={18} />}
        label="Username"
        name="userName"
        rules={{
          required: "Username is required."
        }}
      />
      <ControlledPasswordField
        control={control}
        label="Password"
        name="password"
        rules={{
          required: "Password is required."
        }}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}

describe("Controlled auth form fields", () => {
  it("shows validation for the controlled auth text field", async () => {
    render(<ControlledFieldsHarness />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Username is required.")).toBeDefined();
    });
  });

  it("shows validation for the controlled password field", async () => {
    render(<ControlledFieldsHarness />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Password is required.")).toBeDefined();
    });
  });
});
