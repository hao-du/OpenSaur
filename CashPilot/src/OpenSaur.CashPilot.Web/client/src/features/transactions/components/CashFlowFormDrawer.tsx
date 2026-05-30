import { Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { CashFlowForm, type CashFlowFormValues } from "./CashFlowForm";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";

type Props = {
  editingCashFlow?: {
    id: string;
    amount: number;
    currencyId: string;
    description?: string | null;
    direction: number;
    transactionDate: string;
    isActive: boolean;
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
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
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
  onUpdate?: (id: string, payload: {
    amount: number;
    currencyId: string;
    description?: string;
    direction: number;
    transactionDate: string;
    isActive: boolean;
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
};

export function CashFlowFormDrawer({ editingCashFlow, isOpen, onClose, currencies, onSubmit, onUpdate }: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"form" | "items">("form");
  const form = useForm<CashFlowFormValues>({
    defaultValues: {
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: "2",
      transactionDate: today,
      transactionItems: []
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    if (editingCashFlow != null) {
      form.reset({
        amount: editingCashFlow.amount.toString(),
        currencyId: editingCashFlow.currencyId,
        description: editingCashFlow.description ?? "",
        direction: editingCashFlow.direction.toString(),
        transactionDate: editingCashFlow.transactionDate,
        transactionItems: (editingCashFlow.transactionItems ?? []).map(x => ({
          id: x.id,
          name: x.name,
          amount: x.amount.toString()
        }))
      });
      return;
    }

    form.reset({
      amount: "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      direction: "2",
      transactionDate: today,
      transactionItems: []
    });
  }, [currencies, editingCashFlow, form, isOpen, today]);

  const currencyOptions = useMemo(() => currencies.map(currency => ({ label: currency.shortName, value: currency.id })), [currencies]);
  const selectedCurrencyId = useWatch({ control: form.control, name: "currencyId" });
  const selectedCurrencyCode = currencies.find(x => x.id === selectedCurrencyId)?.shortName;

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingCashFlow == null ? t("transactions.createCashFlowTitle") : t("transactions.editCashFlowTitle")}
      width="wide"
    >
      <Stack spacing={2} component="form" noValidate onSubmit={form.handleSubmit(async values => {
        setIsSubmitting(true);
        try {
          const payload = {
            amount: Number(values.amount),
            currencyId: values.currencyId,
            description: values.description.trim().length === 0 ? undefined : values.description.trim(),
            direction: Number(values.direction),
            transactionDate: values.transactionDate,
            transactionItems: values.transactionItems.filter(x => x.name.trim().length > 0).map(x => ({
              id: x.id,
              name: x.name.trim(),
              amount: Number(x.amount || "0")
            }))
          };

          if (editingCashFlow != null && onUpdate != null) {
            await onUpdate(editingCashFlow.id, { ...payload, isActive: editingCashFlow.isActive });
          } else {
            await onSubmit(payload);
          }
          onClose();
        } finally {
          setIsSubmitting(false);
        }
      })}>
        <TransactionFormTabs
          value={tab}
          onChange={setTab}
          formContent={<CashFlowForm control={form.control} currencyOptions={currencyOptions} isEditMode={editingCashFlow != null} isSubmitting={isSubmitting} />}
          itemsContent={<TransactionItemsEditor control={form.control} name="transactionItems" disabled={isSubmitting} currencyCode={selectedCurrencyCode} />}
        />
      </Stack>
    </DrawerPanel>
  );
}
