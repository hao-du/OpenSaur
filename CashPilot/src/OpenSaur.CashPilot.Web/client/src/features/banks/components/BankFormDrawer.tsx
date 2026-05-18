import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { BankForm, type BankFormValues } from "./BankForm";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  const { t } = useSettings();
  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("banks.editTitle") : t("banks.createTitle")}
    >
      <Stack
        component="form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <BankForm
          control={form.control}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t("counterparties.save") : t("banks.create")}
        />
      </Stack>
    </DrawerPanel>
  );
}

