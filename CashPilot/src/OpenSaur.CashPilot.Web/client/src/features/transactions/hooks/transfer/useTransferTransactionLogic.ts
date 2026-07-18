import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../../infrastructure/http/apiErrorHelpers";
import { transactionDirectionValues } from "../../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useTransferFormByIdQuery } from "./useTransferFormByIdQuery";
import { useCreateTransferMutation } from "./useCreateTransferMutation";
import { useUpdateTransferMutation } from "./useUpdateTransferMutation";
import type { CreateTransferFormRequestDto, UpdateTransferFormRequestDto, TransferFormDto } from "../../dtos/TransactionDto";
import type { TransferMovementDraft } from "../../dtos/TransactionPageState";

type Args = {
  setErrorMessage: (message: string | null) => void;
};

function mapTransferFormToDraft(
  transferForm: TransferFormDto,
  suggestedTags?: string[] | null,
): TransferMovementDraft {
  const amount = Math.abs(
    transferForm.details.reduce((sum, detail) => {
      const detailAmount = Number(detail.amount);
      if (!Number.isFinite(detailAmount)) {
        return sum;
      }

      return sum + (detail.direction === transactionDirectionValues.inflow ? detailAmount : -detailAmount);
    }, 0),
  );

  return {
    amount,
    counterpartyId: transferForm.counterpartyId,
    currencyId: transferForm.currencyId,
    description: transferForm.description,
    details: transferForm.details.map((x) => ({
      amount: x.amount,
      currencyId: x.currencyId,
      description: x.description,
      direction: x.direction,
      id: x.id,
      isActive: x.isActive,
      transactionDate: x.transactionDate,
    })),
    dueDate: transferForm.dueDate,
    id: transferForm.id,
    isActive: transferForm.isActive,
    status: transferForm.status,
    tags: suggestedTags ?? transferForm.tags,
    transactionDate: transferForm.transactionDate,
    transferType: transferForm.transferType,
    transactionItems: transferForm.transactionItems ?? [],
  };
}

export function useTransferTransactionLogic({ setErrorMessage }: Args) {
  const { t } = useSettings();
  const [editingMovement, setEditingMovement] = useState<TransferMovementDraft | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [pendingSuggestedTags, setPendingSuggestedTags] = useState<string[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTransferMutation = useCreateTransferMutation();
  const updateTransferMutation = useUpdateTransferMutation();
  const transferFormQuery = useTransferFormByIdQuery(pendingEditId, pendingEditId != null);

  useEffect(() => {
    if (pendingEditId == null) {
      return;
    }

    if (transferFormQuery.error != null) {
      setErrorMessage(getApiErrorMessage(transferFormQuery.error, t("transactions.errorSave")));
      setPendingEditId(null);
      return;
    }

    if (transferFormQuery.isFetching || transferFormQuery.data == null) {
      return;
    }

    setEditingMovement(
      mapTransferFormToDraft(transferFormQuery.data, pendingSuggestedTags),
    );
    setIsOpen(true);
    setPendingEditId(null);
  }, [pendingEditId, pendingSuggestedTags, setErrorMessage, t, transferFormQuery.data, transferFormQuery.error, transferFormQuery.isFetching]);

  function openCreate() {
    setEditingMovement(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
    setIsOpen(true);
  }

  function openEdit(id: string, transferId?: string | null, suggestedTags?: string[] | null) {
    setErrorMessage(null);
    setEditingMovement(null);
    setPendingSuggestedTags(suggestedTags ?? null);
    setPendingEditId(transferId ?? id);
    setIsOpen(false);
  }

  function close() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setEditingMovement(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
  }

  async function submitCreate(payload: CreateTransferFormRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await createTransferMutation.mutateAsync(payload);
      setIsOpen(false);
      setEditingMovement(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitUpdate(id: string, payload: UpdateTransferFormRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await updateTransferMutation.mutateAsync({ id, payload });
      setIsOpen(false);
      setEditingMovement(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    close,
    editingMovement,
    isOpen,
    isSubmitting,
    openCreate,
    openEdit,
    submitCreate,
    submitUpdate,
  };
}




