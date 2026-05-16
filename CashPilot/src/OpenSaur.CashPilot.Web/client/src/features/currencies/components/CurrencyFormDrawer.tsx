import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CurrencyForm, type CurrencyFormValues } from "./CurrencyForm";

type CurrencyFormDrawerProps = {
  form: UseFormReturn<CurrencyFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CurrencyFormValues) => Promise<void>;
};

export function CurrencyFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: CurrencyFormDrawerProps) {
  const { t } = useSettings();

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("currencies.editTitle") : t("currencies.createTitle")}
    >
      <Stack
        component="form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <CurrencyForm
          control={form.control}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
        />
      </Stack>
    </DrawerPanel>
  );
}

