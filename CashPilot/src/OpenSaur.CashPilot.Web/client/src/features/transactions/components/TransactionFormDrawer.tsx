import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TransactionForm, type CashFlowFormValues } from "./TransactionForm";

type CurrencyOption = {
  label: string;
  value: string;
};

type TransactionFormDrawerProps = {
  currencyOptions: CurrencyOption[];
  form: UseFormReturn<CashFlowFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CashFlowFormValues) => Promise<void>;
};

export function TransactionFormDrawer({
  currencyOptions,
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: TransactionFormDrawerProps) {
  const { t } = useSettings();

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("transactions.editTitle") : t("transactions.createTitle")}
    >
      <Stack
        component="form"
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <TransactionForm
          control={form.control}
          currencyOptions={currencyOptions}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
        />
      </Stack>
    </DrawerPanel>
  );
}
