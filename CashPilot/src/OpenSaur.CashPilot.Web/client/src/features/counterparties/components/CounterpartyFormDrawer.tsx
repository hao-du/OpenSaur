import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CounterpartyForm, type CounterpartyFormValues } from "./CounterpartyForm";

type CounterpartyFormDrawerProps = {
  form: UseFormReturn<CounterpartyFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CounterpartyFormValues) => Promise<void>;
};

export function CounterpartyFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: CounterpartyFormDrawerProps) {
  const { t } = useSettings();

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("counterparties.editTitle") : t("counterparties.createTitle")}
    >
      <Stack
        component="form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <CounterpartyForm
          control={form.control}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
        />
      </Stack>
    </DrawerPanel>
  );
}

