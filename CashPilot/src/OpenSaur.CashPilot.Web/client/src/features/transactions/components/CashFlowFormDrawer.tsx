import { Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { CashFlowForm, type CashFlowFormValues } from "./CashFlowForm";

type Props = {
  editingCashFlow?: {
    id: string;
    amount: number;
    currencyId: string;
    description?: string | null;
    direction: number;
    transactionDate: string;
    isActive: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    amount: number;
    currencyId: string;
    direction: number;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
  onUpdate?: (id: string, payload: {
    amount: number;
    currencyId: string;
    description?: string;
    direction: number;
    transactionDate: string;
    isActive: boolean;
  }) => Promise<void>;
};

export function CashFlowFormDrawer({ editingCashFlow, isOpen, onClose, currencies, onSubmit, onUpdate }: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<CashFlowFormValues>({
    defaultValues: {
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: "2",
      transactionDate: new Date().toISOString().slice(0, 10)
    }
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingCashFlow != null) {
      form.reset({
        amount: editingCashFlow.amount.toString(),
        currencyId: editingCashFlow.currencyId,
        description: editingCashFlow.description ?? "",
        direction: editingCashFlow.direction.toString(),
        transactionDate: editingCashFlow.transactionDate
      });
      return;
    }

    form.reset({
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: "2",
      transactionDate: new Date().toISOString().slice(0, 10)
    });
  }, [currencies, editingCashFlow, form, isOpen]);

  const currencyOptions = useMemo(
    () => currencies.map(currency => ({ label: currency.shortName, value: currency.id })),
    [currencies]
  );

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingCashFlow == null ? t("transactions.createCashFlowTitle") : t("transactions.editCashFlowTitle")}
      width="wide"
    >
      <Stack
        component="form"
        onSubmit={form.handleSubmit(async values => {
          setIsSubmitting(true);
          try {
            const payload = {
              amount: Number(values.amount),
              currencyId: values.currencyId,
              description: values.description.trim().length === 0 ? undefined : values.description.trim(),
              direction: Number(values.direction),
              transactionDate: values.transactionDate
            };

            if (editingCashFlow != null && onUpdate != null) {
              await onUpdate(editingCashFlow.id, {
                ...payload,
                isActive: editingCashFlow.isActive
              });
            } else {
              await onSubmit(payload);
            }
            onClose();
          } finally {
            setIsSubmitting(false);
          }
        })}
      >
        <CashFlowForm
          control={form.control}
          currencyOptions={currencyOptions}
          isEditMode={editingCashFlow != null}
          isSubmitting={isSubmitting}
        />
      </Stack>
    </DrawerPanel>
  );
}
