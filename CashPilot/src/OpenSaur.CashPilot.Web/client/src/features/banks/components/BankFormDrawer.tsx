import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { BankForm, type BankFormValues } from "./BankForm";

type BankFormDrawerProps = {
  form: UseFormReturn<BankFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BankFormValues) => Promise<void>;
};

export function BankFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: BankFormDrawerProps) {
  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit bank" : "Create bank"}
    >
      <Stack
        component="form"
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <BankForm
          control={form.control}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? "Save" : "Create"}
        />
      </Stack>
    </DrawerPanel>
  );
}
