import { Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import {
  transactionDirectionValues,
  transactionFormTabs,
  transferStatuses,
  transferTypes,
} from "../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransactionItemsEditor } from "./TransactionItemsEditor";
import { TransactionFormTabs } from "./TransactionFormTabs";
import { TransferFormTransaction, type TransferDetailEditor } from "./TransferFormTransaction";
import { TransferHeaderForm, type TransferHeaderValues } from "./TransferHeaderForm";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
  tagOptions?: string[];
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
  formId: string;
  isSubmitting?: boolean;
  onCompleted?: () => void;
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: "Transfer") => Promise<string[]>;
  onAutoTagActionChange?: (handler: (() => Promise<void>) | null) => void;
};

type TransferItemsFormValues = {
  transactionItems: Array<{ id?: string; name: string; amount: string }>;
};

function getDefaultHeaderValues(counterparties: CounterpartyDto[], currencies: CurrencyDto[], today: string): TransferHeaderValues {
  return {
    amount: "0",
    counterpartyId: counterparties[0]?.id ?? "",
    currencyId: currencies[0]?.id ?? "",
    description: "",
    dueDate: "",
    transactionDate: today,
    transferType: String(transferTypes.lend),
    status: String(transferStatuses.active),
    tags: [],
  };
}

function getInitialHeaderValues(
  movementInitialValue: Props["movementInitialValue"],
  counterparties: CounterpartyDto[],
  currencies: CurrencyDto[],
  today: string,
): TransferHeaderValues {
  if (movementInitialValue == null) {
    return getDefaultHeaderValues(counterparties, currencies, today);
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
}

function getInitialDetails(movementInitialValue: Props["movementInitialValue"], movementInitialDetails: Props["movementInitialDetails"]) {
  if (movementInitialValue == null) {
    return [] as TransferDetailEditor[];
  }

  return (movementInitialDetails ?? []).map((x) => ({
    amount: x.amount.toString(),
    clientKey: crypto.randomUUID(),
    description: x.description ?? "",
    direction: x.direction.toString(),
    id: x.id,
    isActive: x.isActive,
    transactionDate: x.transactionDate,
  }));
}

function getInitialTransactionItems(
  movementInitialValue: Props["movementInitialValue"],
  movementInitialTransactionItems: Props["movementInitialTransactionItems"],
) {
  if (movementInitialValue == null) {
    return [];
  }

  return (movementInitialTransactionItems ?? []).map((x) => ({
    id: x.id,
    name: x.name,
    amount: x.amount.toString(),
  }));
}

export function TransferForm({
  counterparties,
  currencies,
  formId,
  onSave,
  tagOptions,
  movementInitialValue,
  movementInitialDetails = [],
  movementInitialTransactionItems = [],
  isSubmitting = false,
  onCompleted,
  isAutoTagging = false,
  onAutoTag,
  onAutoTagActionChange,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const today = todayIsoDate;
  const isBusy = isSubmitting || isAutoTagging;
  const [tab, setTab] = useState<(typeof transactionFormTabs)[keyof typeof transactionFormTabs]>(transactionFormTabs.form);

  const initialHeaderValues = getInitialHeaderValues(movementInitialValue, counterparties, currencies, today);
  const initialDetails = getInitialDetails(movementInitialValue, movementInitialDetails);
  const initialTransactionItems = getInitialTransactionItems(movementInitialValue, movementInitialTransactionItems);

  const headerForm = useForm<TransferHeaderValues>({
    defaultValues: initialHeaderValues,
  });
  const [details, setDetails] = useState<TransferDetailEditor[]>(() => initialDetails);
  const transactionItemsForm = useForm<TransferItemsFormValues>({
    defaultValues: { transactionItems: initialTransactionItems },
  });

  const calculatedAmount = details.reduce(
    (sum, x) => sum + (Number.isFinite(Number(x.amount)) ? Number(x.amount) : 0),
    0,
  );
  const selectedCurrencyId = useWatch({
    control: headerForm.control,
    name: "currencyId",
  });
  const selectedCurrencyCode = currencies.find((x) => x.id === selectedCurrencyId)?.shortName;

  const addNewDetail = () =>
    setDetails((prev) => [
      ...prev,
      {
        amount: "",
        clientKey: crypto.randomUUID(),
        description: "",
        direction: String(transactionDirectionValues.inflow),
        isNew: true,
        transactionDate: headerForm.getValues("transactionDate") ?? today,
      },
    ]);

  const handleAutoTag = async () => {
    if (onAutoTag == null) {
      return;
    }

    const headerValues = headerForm.getValues();
    const tags = await onAutoTag(headerValues.description, headerValues.tags, "Transfer");
    headerForm.setValue("tags", tags, { shouldDirty: true, shouldTouch: true });
  };

  useEffect(() => {
    onAutoTagActionChange?.(onAutoTag == null ? null : handleAutoTag);
    return () => {
      onAutoTagActionChange?.(null);
    };
  }, [handleAutoTag, onAutoTag, onAutoTagActionChange]);

  const handleSave = async () => {
    const headerValues = headerForm.getValues();
    if (calculatedAmount <= 0) {
      return;
    }
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
      description: headerValues.description.trim().length === 0 ? undefined : headerValues.description.trim(),
      details: details.map((detail) => ({
        amount: Number(detail.amount),
        currencyId: headerValues.currencyId,
        description: detail.description.trim().length === 0 ? undefined : detail.description.trim(),
        direction: Number(detail.direction),
        id: detail.id,
        isActive: detail.isActive ?? true,
        transactionDate: detail.transactionDate,
      })),
      dueDate: headerValues.dueDate.trim().length === 0 ? undefined : headerValues.dueDate,
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
    <Stack
      component="form"
      id={formId}
      spacing={2}
      noValidate
      onSubmit={headerForm.handleSubmit(async () => {
        await handleSave();
      })}
    >
      <TransactionFormTabs
        value={tab}
        onChange={setTab}
        formContent={
          <Stack spacing={2}>
            <TransferHeaderForm
              counterparties={counterparties}
              currencies={currencies}
              control={headerForm.control}
              amountDisabled
              tagOptions={tagOptions}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <h3 style={{ margin: 0 }}>{t("transactions.transactionDetails")}</h3>
              <ActionButton
                onClick={addNewDetail}
                color="secondary"
                size="small"
                disabled={isBusy}
              >
                {t("transactions.addTransaction")}
              </ActionButton>
            </Stack>
            <Stack spacing={2}>
              {details.map((detail) => (
                  <TransferFormTransaction
                    key={detail.clientKey}
                    detail={detail}
                    isSubmitting={isBusy}
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
          </Stack>
        }
        itemsContent={
          <TransactionItemsEditor
            control={transactionItemsForm.control}
            name="transactionItems"
            disabled={isBusy}
            currencyCode={selectedCurrencyCode}
          />
        }
      />
    </Stack>
  );
}
