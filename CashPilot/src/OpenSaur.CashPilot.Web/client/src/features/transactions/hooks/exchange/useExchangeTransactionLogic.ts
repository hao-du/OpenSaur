import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useCurrencyExchangeByIdQuery } from "./useCurrencyExchangeByIdQuery";
import { useCreateCurrencyExchangeMutation } from "./useCreateCurrencyExchangeMutation";
import { useUpdateCurrencyExchangeMutation } from "./useUpdateCurrencyExchangeMutation";
import type { CreateCurrencyExchangeRequestDto, CurrencyExchangeDetailDto, UpdateCurrencyExchangeRequestDto } from "../../dtos/TransactionDto";
import type { ExchangeDraft } from "../../dtos/TransactionPageState";

type Args = {
  setErrorMessage: (message: string | null) => void;
};

function mapExchangeDetailToDraft(
  detail: CurrencyExchangeDetailDto,
  suggestedTags?: string[] | null,
): ExchangeDraft {
  return {
    description: detail.description,
    exchangeDate: detail.exchangeDate,
    exchangeRate: detail.exchangeRate,
    id: detail.id,
    inAmount: detail.inLeg.amount,
    inCurrencyId: detail.inLeg.currencyId,
    isActive: detail.isActive,
    outAmount: detail.outLeg.amount,
    outCurrencyId: detail.outLeg.currencyId,
    tags: suggestedTags ?? detail.tags,
    transactionItems: detail.transactionItems ?? [],
  };
}

export function useExchangeTransactionLogic({ setErrorMessage }: Args) {
  const { t } = useSettings();
  const [editingExchange, setEditingExchange] = useState<ExchangeDraft | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [pendingSuggestedTags, setPendingSuggestedTags] = useState<string[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCurrencyExchangeMutation = useCreateCurrencyExchangeMutation();
  const updateCurrencyExchangeMutation = useUpdateCurrencyExchangeMutation();
  const currencyExchangeQuery = useCurrencyExchangeByIdQuery(pendingEditId, pendingEditId != null);

  useEffect(() => {
    if (pendingEditId == null) {
      return;
    }

    if (currencyExchangeQuery.error != null) {
      setErrorMessage(getApiErrorMessage(currencyExchangeQuery.error, t("transactions.errorSave")));
      setPendingEditId(null);
      return;
    }

    if (currencyExchangeQuery.isFetching || currencyExchangeQuery.data == null) {
      return;
    }

    setEditingExchange(
      mapExchangeDetailToDraft(currencyExchangeQuery.data, pendingSuggestedTags),
    );
    setIsOpen(true);
     
    setPendingEditId(null);
  }, [currencyExchangeQuery.data, currencyExchangeQuery.error, currencyExchangeQuery.isFetching, pendingEditId, pendingSuggestedTags, setErrorMessage, t]);

  function openCreate() {
    setEditingExchange(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
    setIsOpen(true);
  }

  function openEdit(id: string, suggestedTags?: string[] | null) {
    setErrorMessage(null);
    setEditingExchange(null);
    setPendingSuggestedTags(suggestedTags ?? null);
    setPendingEditId(id);
    setIsOpen(false);
  }

  function close() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setEditingExchange(null);
    setPendingSuggestedTags(null);
    setPendingEditId(null);
  }

  async function submitCreate(payload: CreateCurrencyExchangeRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await createCurrencyExchangeMutation.mutateAsync(payload);
      setIsOpen(false);
      setEditingExchange(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitUpdate(id: string, payload: UpdateCurrencyExchangeRequestDto) {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await updateCurrencyExchangeMutation.mutateAsync({ id, payload });
      setIsOpen(false);
      setEditingExchange(null);
      setPendingSuggestedTags(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    close,
    editingExchange,
    isOpen,
    isSubmitting,
    openCreate,
    openEdit,
    submitCreate,
    submitUpdate,
  };
}
