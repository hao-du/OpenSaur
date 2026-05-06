import { Stack } from "@mui/material";
import type { Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";

export type BankFormValues = {
  name: string;
  shortName: string;
  description: string;
  isDefault: boolean;
};

type BankFormProps = {
  control: Control<BankFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
};

export function BankForm({
  control,
  isSubmitting,
  submitLabel
}: BankFormProps) {
  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
      <Text
        control={control}
        disabled={isSubmitting}
        label="Name"
        name="name"
        required
        rules={{
          required: "Name is required.",
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : "Name is required."
        }}
      />
      <Text
        control={control}
        disabled={isSubmitting}
        helperText="e.g. SCB, TCB"
        label="Short Bank Name"
        name="shortName"
        required
        rules={{
          required: "Short bank name is required.",
          validate: value => typeof value === "string" && value.trim().length > 0 ? true : "Short bank name is required."
        }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label="Description"
        minRows={3}
        name="description"
      />
      <CheckBox
        control={control}
        disabled={isSubmitting}
        label="Is Default"
        name="isDefault"
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Working..." : submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
