import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useBanksQuery } from "../../../banks/hooks/useBanksQuery";
import { useCurrenciesQuery } from "../../../currencies/hooks/useCurrenciesQuery";
import { useCounterpartiesQuery } from "../../../counterparties/hooks/useCounterpartiesQuery";
import { useTransactionsQuery } from "../shared/useTransactionsQuery";
import { useDeleteTransactionMutation } from "../shared/useDeleteTransactionMutation";
import { useAutoTagMutation } from "../shared/useAutoTagMutation";
import type { TransactionDeleteTarget, TransactionType } from "../../dtos/TransactionPageState";
import type { TransactionFilterValues } from "../../components/TransactionsFilterDrawer";

const ITEMS_PER_PAGE = 30;

export function useTransactionsPageLogic() {
  const { formatAmount, formatDate, t } = useSettings();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDeleteTarget | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const [filters, setFilters] = useState<TransactionFilterValues>({
    description: "",
    fromDate: startOfMonth,
    rangePreset: "Month",
    toDate: endOfMonth,
    types: ["CashFlow", "BankAccount", "Transfer", "Exchange"],
    showOnlyInitialDeposits: false,
  });
  const selectedDate = searchParams.get("date") ?? "";

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      fromDate: selectedDate,
      toDate: selectedDate,
      rangePreset: "Custom",
    }));
  }, [selectedDate]);

  const banks = useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const currenciesQuery = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });
  const currencies = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
  const counterparties = useCounterpartiesQuery({
    isActive: true,
    fullName: "",
    email: "",
    phoneNumber: "",
  }).data ?? [];
  const transactionsQuery = useTransactionsQuery({
    description: filters.description,
    fromDate: filters.fromDate,
    showOnlyInitialDeposits: filters.showOnlyInitialDeposits,
    toDate: filters.toDate,
    types: filters.types,
  });
  const autoTagMutation = useAutoTagMutation();
  const deleteTransactionMutation = useDeleteTransactionMutation();
  const isTransactionsLoading =
    transactionsQuery.isLoading ||
    transactionsQuery.isFetching ||
    !transactionsQuery.data;
  const isAutoTagging = autoTagMutation.isPending;

  const filteredTransactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE),
  );
  const pagedTransactions = useMemo(
    () =>
      filteredTransactions.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE,
      ),
    [filteredTransactions, page],
  );

  useEffect(() => {
     
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (page > pageCount) {
       
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const requestAutoTags = async (
    description: string | null | undefined,
    existingTags: string[] | null | undefined,
    transactionType: TransactionType,
  ) => {
    try {
      setErrorMessage(null);
      const response = await autoTagMutation.mutateAsync({
        description,
        existingTags: existingTags ?? [],
        transactionType,
      });

      return response.tags;
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorAutoTag")));
      return existingTags ?? [];
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deletingTransaction == null) {
      return;
    }

    try {
      setIsDeleteConfirming(true);
      setErrorMessage(null);
      await deleteTransactionMutation.mutateAsync({
        id: deletingTransaction.id,
        type: deletingTransaction.type,
      });
      setDeletingTransaction(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsDeleteConfirming(false);
    }
  };

  return {
    banks,
    currencies,
    counterparties,
    deletingTransaction,
    errorMessage,
    filters,
    formatAmount,
    formatDate,
    isDeleteConfirming,
    isFilterDrawerOpen,
    isAutoTagging,
    isTransactionsLoading,
    page,
    pageCount,
    pagedTransactions,
    requestAutoTags,
    setDeletingTransaction,
    setFilters,
    setIsFilterDrawerOpen,
    setPage,
    setErrorMessage,
    transactions: filteredTransactions,
    closeDeleteConfirm: () => {
      if (!isDeleteConfirming) {
        setDeletingTransaction(null);
      }
    },
    handleDeleteConfirmed,
  };
}
