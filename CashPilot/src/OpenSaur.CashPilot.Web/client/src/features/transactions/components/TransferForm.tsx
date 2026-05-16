import { Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferHeaderForm } from "./TransferHeaderForm";
import { TransferFormTransaction, type TransferDetailEditor } from "./TransferFormTransaction";
import { ActionButton } from "../../../components/atoms/ActionButton";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSave: (payload: SaveTransferFormRequestDto) => Promise<void>;
  movementInitialValue?: {
    id: string;
    counterpartyId: string;
    transferType: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
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
  movementSubmitLabel?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  headerSubmitLabel?: string;
  onCompleted?: () => void;
};

type TransferHeaderValues = {
  counterpartyId: string;
  transferType: string;
  currencyId: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  description: string;
};

export function TransferForm({ counterparties, currencies, onSave, movementInitialValue, movementInitialDetails = [], movementSubmitLabel = "Create", isSubmitting = false, submitLabel = "Create", headerSubmitLabel = "Apply Header", onCompleted }: Props) {
  const defaultHeaderValues = useMemo<TransferHeaderValues>(() => ({
    amount: "0",
    counterpartyId: counterparties[0]?.id ?? "",
    currencyId: currencies[0]?.id ?? "",
    description: "",
    dueDate: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    transferType: "1"
  }), [counterparties, currencies]);

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
      transferType: movementInitialValue.transferType.toString()
    };
  }, [defaultHeaderValues, movementInitialValue]);

  const [headerDraft, setHeaderDraft] = useState<TransferHeaderValues>(defaultHeaderValues);
  const [details, setDetails] = useState<TransferDetailEditor[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const calculatedAmount = useMemo(
    () => details.reduce((sum, x) => sum + (Number.isFinite(Number(x.amount)) ? Number(x.amount) : 0), 0),
    [details]
  );

  useEffect(() => {
    if (movementInitialValue == null) {
      setHeaderDraft(defaultHeaderValues);
      return;
    }
    setHeaderDraft(initialHeaderValues);
    setDetails(movementInitialDetails.map(x => ({
      amount: x.amount.toString(),
      clientKey: crypto.randomUUID(),
      description: x.description ?? "",
      direction: x.direction.toString(),
      id: x.id,
      isActive: x.isActive,
      transactionDate: x.transactionDate
    })));
  }, [defaultHeaderValues, initialHeaderValues, movementInitialDetails, movementInitialValue]);

  const visibleDetails = details;

  const addNewDetail = () => {
    setDetails(prev => [...prev, {
      amount: "",
      clientKey: crypto.randomUUID(),
      description: "",
      direction: "1",
      isNew: true,
      transactionDate: (headerDraft?.transactionDate ?? today)
    }]);
  };

  const updateDetail = (clientKey: string, updated: TransferDetailEditor) => {
    setDetails(prev => prev.map(x => x.clientKey === clientKey ? updated : x));
  };

  const removeDetail = (clientKey: string) => {
    setDetails(prev => prev.filter(x => x.clientKey !== clientKey));
  };

  const handleHeaderSubmit = (values: TransferHeaderValues) => {
    setHeaderDraft(values);
  };

  const handleSave = async () => {
    if (headerDraft.counterpartyId.trim().length === 0 || headerDraft.currencyId.trim().length === 0 || headerDraft.transactionDate.trim().length === 0) {
      return;
    }

    await onSave({
      amount: calculatedAmount,
      counterpartyId: headerDraft.counterpartyId,
      currencyId: headerDraft.currencyId,
      description: headerDraft.description.trim().length === 0 ? undefined : headerDraft.description.trim(),
      details: visibleDetails.map(detail => ({
        amount: Number(detail.amount),
        currencyId: headerDraft.currencyId,
        description: detail.description.trim().length === 0 ? undefined : detail.description.trim(),
        direction: Number(detail.direction),
        id: detail.id,
        isActive: detail.isActive ?? true,
        transactionDate: detail.transactionDate
      })),
      dueDate: headerDraft.dueDate.trim().length === 0 ? undefined : headerDraft.dueDate,
      id: movementInitialValue?.id,
      isActive: true,
      transactionDate: headerDraft.transactionDate,
      transferType: Number(headerDraft.transferType)
    });
    onCompleted?.();
  };

  return (
    <Stack spacing={3}>
      <h3 style={{ margin: 0 }}>Transfer Header</h3>
      <TransferHeaderForm
        calculatedAmount={calculatedAmount}
        counterparties={counterparties}
        currencies={currencies}
        initialValues={initialHeaderValues}
        isSubmitting={isSubmitting}
        onChange={payload => {
          handleHeaderSubmit({
            amount: payload.amount.toString(),
            counterpartyId: payload.counterpartyId,
            currencyId: payload.currencyId,
            description: payload.description ?? "",
            dueDate: payload.dueDate ?? "",
            transactionDate: payload.transactionDate,
            transferType: payload.transferType.toString()
          });
        }}
        onSubmit={async () => {}}
        showSubmit={false}
        submitLabel={headerSubmitLabel}
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <h3 style={{ margin: 0 }}>Transaction Details</h3>
        <ActionButton onClick={addNewDetail} color="secondary" size="small" disabled={isSubmitting}>
          Add Transaction
        </ActionButton>
      </Stack>

      <Stack spacing={2}>
        {visibleDetails.map(detail => (
          <TransferFormTransaction
            key={detail.clientKey}
            detail={detail}
            isSubmitting={isSubmitting}
            onAccept={updated => updateDetail(detail.clientKey, updated)}
            onDelete={() => removeDetail(detail.clientKey)}
            onCancelNew={() => removeDetail(detail.clientKey)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end">
        <ActionButton disabled={isSubmitting || calculatedAmount <= 0} onClick={() => { void handleSave(); }}>
          {isSubmitting ? "Working..." : movementSubmitLabel ?? submitLabel}
        </ActionButton>
      </Stack>
    </Stack>
  );
}
