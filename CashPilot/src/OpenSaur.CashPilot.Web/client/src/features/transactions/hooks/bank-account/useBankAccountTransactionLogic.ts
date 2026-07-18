import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useBankAccountByIdQuery } from "./useBankAccountByIdQuery";
import { useCreateBankAccountMutation } from "./useCreateBankAccountMutation";
import { useUpdateBankAccountMutation } from "./useUpdateBankAccountMutation";
import type {
  CreateBankAccountFormRequestDto,
  SaveBankAccountFormRequestDto,
  UpdateBankAccountFormRequestDto,
} from "../../dtos/TransactionDto";

type Args = {
  setErrorMessage: (message: string | null) => void;
};

export function useBankAccountTransactionLogic({ setErrorMessage }: Args) {
  const { t } = useSettings();
  const [editingBankAccount, setEditingBankAccount] =
    useState<SaveBankAccountFormRequestDto | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [pendingSuggestedTags, setPendingSuggestedTags] = useState<string[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createBankAccountMutation = useCreateBankAccountMutation();
  const updateBankAccountMutation = useUpdateBankAccountMutation();
  const bankAccountQuery = useBankAccountByIdQuery(pendingEditId, pendingEditId != null);

  useEffect(() => {
    if (pendingEditId == null) {
      return;
    }

    if (bankAccountQuery.error != null) {
      setErrorMessage(getApiErrorMessage(bankAccountQuery.error, t("transactions.errorSave")));
      setPendingEditId(null);
      return;
    }

    if (bankAccountQuery.isFetching || bankAccountQuery.data == null) {
      return;
    }

    setEditingBankAccount(
      pendingSuggestedTags == null
        ? bankAccountQuery.data
        : { ...bankAccountQuery.data, tags: pendingSuggestedTags },
    );
    setIsOpen(true);
    setPendingEditId(null);
  }, [bankAccountQuery.data, bankAccountQuery.error, bankAccountQuery.isFetching, pendingEditId, pendingSuggestedTags, setErrorMessage, t]);

  function openCreate() {
    setEditingBankAccount(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
    setIsOpen(true);
  }

  function openEdit(id: string, suggestedTags?: string[] | null) {
    setErrorMessage(null);
    setEditingBankAccount(null);
    setPendingSuggestedTags(suggestedTags ?? null);
    setPendingEditId(id);
    setIsOpen(false);
  }

  function close() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setEditingBankAccount(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
  }

  async function submitCreate(payload: CreateBankAccountFormRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await createBankAccountMutation.mutateAsync(payload);
      setIsOpen(false);
      setEditingBankAccount(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitUpdate(
    id: string,
    payload: UpdateBankAccountFormRequestDto,
  ) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await updateBankAccountMutation.mutateAsync({ id, payload });
      setIsOpen(false);
      setEditingBankAccount(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    close,
    editingBankAccount,
    isOpen,
    isSubmitting,
    openCreate,
    openEdit,
    submitCreate,
    submitUpdate,
  };
}




