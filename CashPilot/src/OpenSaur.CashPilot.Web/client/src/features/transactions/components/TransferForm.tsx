import { Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferHeaderForm, type TransferHeaderValues } from "./TransferHeaderForm";
import { TransferFormTransaction, type TransferDetailEditor } from "./TransferFormTransaction";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
  movementInitialValue?: {
    id: string;
    counterpartyId: string;
    transferType: number;
    status: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
    tags?: string[] | null;
  } | null;
  movementInitialDetails?: Array<{
    id: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
    isActive: boolean;
  }>;
  movementInitialTransactionItems?: Array<{ id?: string; name: string; amount: number }>;
  movementSubmitLabel?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCompleted?: () => void;
};

type TransferItemsFormValues = {
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

export function TransferForm({
  counterparties,
  currencies,
  onSave,
  movementInitialValue,
  movementInitialDetails = [],
  movementInitialTransactionItems = [],
  movementSubmitLabel = "Create",
  isSubmitting = false,
  submitLabel = "Create",
  onCompleted,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const [tab, setTab] = useState<"form" | "items">("form");

  const defaultHeaderValues = useMemo<TransferHeaderValues>(
    () => ({
      amount: "0",
      counterpartyId: counterparties[0]?.id ?? "",
      currencyId: currencies[0]?.id ?? "",
      description: "",
      dueDate: "",
      transactionDate: today,
      transferType: "1",
      status: "1",
      tags: [],
    }),
    [counterparties, currencies, today],
  );

  const initialHeaderValues = useMemo<TransferHeaderValues>(() => {
    if (movementInitialValue == null) {
      return defaultHeaderValues;
    }

    return {
      amount: movementInitialValue.amount.toString(),
      counterpartyId: movementInitialValue.counterpartyId,
      currencyId: movementInitialValue.currencyId,
      description: movementInitialValue.description ?? "",
      dueDate: movementInitialValue.dueDate ?? "",
      transactionDate: movementInitialValue.transactionDate,
      transferType: movementInitialValue.transferType.toString(),
      status: movementInitialValue.status.toString(),
      tags: movementInitialValue.tags ?? [],
    };
  }, [defaultHeaderValues, movementInitialValue]);

  const headerForm = useForm<TransferHeaderValues>({
    defaultValues: defaultHeaderValues,
  });
  const [details, setDetails] = useState<TransferDetailEditor[]>([]);
  const transactionItemsForm = useForm<TransferItemsFormValues>({
    defaultValues: { transactionItems: [] },
  });

  const calculatedAmount = useMemo(
    () =>
      details.reduce(
        (sum, x) =>
          sum + (Number.isFinite(Number(x.amount)) ? Number(x.amount) : 0),
        0,
      ),
    [details],
  );
  const selectedCurrencyId = useWatch({
    control: headerForm.control,
    name: "currencyId",
  });
  const selectedCurrencyCode = currencies.find((x) => x.id === selectedCurrencyId)
    ?.shortName;

  useEffect(() => {
    headerForm.reset(initialHeaderValues);
  }, [headerForm, initialHeaderValues]);

  useEffect(() => {
    headerForm.setValue("amount", calculatedAmount.toString(), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [calculatedAmount, headerForm]);

  useEffect(() => {
    if (movementInitialValue == null) {
      setDetails([]);
      transactionItemsForm.reset({ transactionItems: [] });
      return;
    }

    setDetails(
      movementInitialDetails.map((x) => ({
        amount: x.amount.toString(),
        clientKey: crypto.randomUUID(),
        description: x.description ?? "",
        direction: x.direction.toString(),
        id: x.id,
        isActive: x.isActive,
        transactionDate: x.transactionDate,
      })),
    );
    transactionItemsForm.reset({
      transactionItems: (movementInitialTransactionItems ?? []).map((x) => ({
        id: x.id,
        name: x.name,
        amount: x.amount.toString(),
      })),
    });
  }, [
    movementInitialDetails,
    movementInitialTransactionItems,
    movementInitialValue,
    transactionItemsForm,
  ]);

  const addNewDetail = () =>
    setDetails((prev) => [
      ...prev,
      {
        amount: "",
        clientKey: crypto.randomUUID(),
        description: "",
        direction: "1",
        isNew: true,
        transactionDate: headerForm.getValues("transactionDate") ?? today,
      },
    ]);

  const handleSave = async () => {
    const headerValues = headerForm.getValues();
    if (
      headerValues.counterpartyId.trim().length === 0 ||
      headerValues.currencyId.trim().length === 0 ||
      headerValues.transactionDate.trim().length === 0
    ) {
      return;
    }

    const transactionItems = transactionItemsForm.getValues("transactionItems");
    await onSave({
      amount: calculatedAmount,
      counterpartyId: headerValues.counterpartyId,
      currencyId: headerValues.currencyId,
      description:
        headerValues.description.trim().length === 0
          ? undefined
          : headerValues.description.trim(),
      details: details.map((detail) => ({
        amount: Number(detail.amount),
        currencyId: headerValues.currencyId,
        description:
          detail.description.trim().length === 0
            ? undefined
            : detail.description.trim(),
        direction: Number(detail.direction),
        id: detail.id,
        isActive: detail.isActive ?? true,
        transactionDate: detail.transactionDate,
      })),
      dueDate:
        headerValues.dueDate.trim().length === 0
          ? undefined
          : headerValues.dueDate,
      id: movementInitialValue?.id,
      isActive: true,
      transactionDate: headerValues.transactionDate,
      transferType: Number(headerValues.transferType),
      status: Number(headerValues.status),
      tags: headerValues.tags,
      transactionItems: transactionItems
        .filter((x) => x.name.trim().length > 0)
        .map((x) => ({
          id: x.id,
          name: x.name.trim(),
          amount: Number(x.amount || "0"),
        })),
    });
    onCompleted?.();
  };

  return (
    <Stack spacing={2}>
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        formContent={
          <Stack spacing={2}>
            <TransferHeaderForm
              counterparties={counterparties}
              currencies={currencies}
              control={headerForm.control}
              isSubmitting={isSubmitting}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0 }}>{t("transactions.transactionDetails")}</h3>
              <ActionButton
                onClick={addNewDetail}
                color="secondary"
                size="small"
                disabled={isSubmitting}
              >
                {t("transactions.addTransaction")}
              </ActionButton>
            </Stack>
            <Stack spacing={2}>
              {details.map((detail) => (
                <TransferFormTransaction
                  key={detail.clientKey}
                  detail={detail}
                  isSubmitting={isSubmitting}
                  onAccept={(updated) =>
                    setDetails((prev) =>
                      prev.map((x) =>
                        x.clientKey === detail.clientKey ? updated : x,
                      ),
                    )
                  }
                  onDelete={() =>
                    setDetails((prev) =>
                      prev.filter((x) => x.clientKey !== detail.clientKey),
                    )
                  }
                  onCancelNew={() =>
                    setDetails((prev) =>
                      prev.filter((x) => x.clientKey !== detail.clientKey),
                    )
                  }
                />
              ))}
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
              <ActionButton
                disabled={isSubmitting || calculatedAmount <= 0}
                onClick={() => {
                  void handleSave();
                }}
              >
                {isSubmitting ? t("action.working") : movementSubmitLabel ?? submitLabel}
              </ActionButton>
            </Stack>
          </Stack>
        }
        itemsContent={
          <TransactionItemsEditor
            control={transactionItemsForm.control}
            name="transactionItems"
            disabled={isSubmitting}
            currencyCode={selectedCurrencyCode}
          />
        }
      />
    </Stack>
  );
}
