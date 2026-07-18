import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useUpdateCashFlowMutation } from "./useUpdateCashFlowMutation";
import { useCreateCashFlowMutation } from "./useCreateCashFlowMutation";
import type { CashFlowDetailDto, CreateCashFlowRequestDto } from "../../dtos/TransactionDto";
import { useCashFlowByIdQuery } from "./useCashFlowByIdQuery";

type Args = {
  setErrorMessage: (message: string | null) => void;
};

export function useCashFlowTransactionLogic({ setErrorMessage }: Args) {
  const { t } = useSettings();
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlowDetailDto | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [pendingSuggestedTags, setPendingSuggestedTags] = useState<string[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCashFlowMutation = useCreateCashFlowMutation();
  const updateCashFlowMutation = useUpdateCashFlowMutation();
  const cashFlowQuery = useCashFlowByIdQuery(pendingEditId, pendingEditId != null);

  useEffect(() => {
    if (pendingEditId == null) {
      return;
    }

    if (cashFlowQuery.error != null) {
      setErrorMessage(getApiErrorMessage(cashFlowQuery.error, t("transactions.errorSave")));
      setPendingEditId(null);
      return;
    }

    if (cashFlowQuery.isFetching || cashFlowQuery.data == null) {
      return;
    }

    setEditingCashFlow(
      pendingSuggestedTags == null
        ? cashFlowQuery.data
        : { ...cashFlowQuery.data, tags: pendingSuggestedTags },
    );
    setIsOpen(true);
    setPendingEditId(null);
  }, [cashFlowQuery.data, cashFlowQuery.error, cashFlowQuery.isFetching, pendingEditId, pendingSuggestedTags, setErrorMessage, t]);

  function openCreate() {
    setEditingCashFlow(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
    setIsOpen(true);
  }

  function openEdit(id: string, suggestedTags?: string[] | null) {
    setErrorMessage(null);
    setEditingCashFlow(null);
    setPendingSuggestedTags(suggestedTags ?? null);
    setPendingEditId(id);
    setIsOpen(false);
  }

  function close() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setEditingCashFlow(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
  }

  async function submitCreate(payload: CreateCashFlowRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await createCashFlowMutation.mutateAsync(payload);
      setIsOpen(false);
      setEditingCashFlow(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitUpdate(
    id: string,
    payload: CreateCashFlowRequestDto & { isActive: boolean },
  ) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await updateCashFlowMutation.mutateAsync({ id, payload });
      setIsOpen(false);
      setEditingCashFlow(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    close,
    editingCashFlow,
    isOpen,
    isSubmitting,
    openCreate,
    openEdit,
    submitCreate,
    submitUpdate,
  };
}




