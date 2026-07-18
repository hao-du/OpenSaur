import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { loadOfflineMetadataSnapshot } from "../../offline/storages/offlineMetadataStore";
import type { OfflineTransactionRecord } from "../../offline/storages/offlineTransactionsStore";
import { OfflineCashFlowFormDrawer } from "../../offline/components/OfflineCashFlowFormDrawer";
import { OfflineBankAccountFormDrawer } from "../../offline/components/OfflineBankAccountFormDrawer";
import { OfflineTransferFormDrawer } from "../../offline/components/OfflineTransferFormDrawer";
import { OfflineExchangeFormDrawer } from "../../offline/components/OfflineExchangeFormDrawer";
import { usePendingTransactionsQuery } from "./usePendingTransactionsQuery";
import { deletePendingTransaction, syncPendingTransactions, updatePendingTransaction } from "../api/pendingTransactionsApi";
import type { PendingTransactionSubmissionDto } from "../dtos/PendingTransactionDto";

function formatTranslation(template: string, count: number) {
  return template.replace("{count}", String(count));
}

export function usePendingTransactionsPageLogic() {
  const { t } = useSettings();
  const { data: currentProfile } = useCurrentProfileQuery();
  const { data: pendingTransactions = [], isLoading, refetch } = usePendingTransactionsQuery();
  const { data: currencies = [] } = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });
  const { data: banks = [] } = useBanksQuery({ isActive: true, name: "", shortName: "" });
  const { data: counterparties = [] } = useCounterpartiesQuery({ email: "", fullName: "", isActive: true, phoneNumber: "" });
  const metadataSnapshot = loadOfflineMetadataSnapshot(currentProfile?.id);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<PendingTransactionSubmissionDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => pendingTransactions.some((item) => item.id === id)),
    [selectedIds, pendingTransactions]
  );

  const refreshPendingTransactions = async () => {
    await refetch();
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; record: Omit<OfflineTransactionRecord, "updatedAt"> }) => {
      const nextRecord: OfflineTransactionRecord = {
        ...payload.record,
        updatedAt: new Date().toISOString(),
        userId: currentProfile?.id ?? payload.record.userId,
      };
      await updatePendingTransaction(payload.id, nextRecord);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.updateError"));
    },
    onSuccess: async () => {
      setErrorMessage(null);
      await refreshPendingTransactions();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePendingTransaction,
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.errorDeleting"));
    },
    onSuccess: async (_, deletedId) => {
      setErrorMessage(null);
      setSelectedIds((current) => current.filter((id) => id !== deletedId));
      await refreshPendingTransactions();
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncPendingTransactions,
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.syncError"));
    },
    onSuccess: async (result) => {
      setErrorMessage(null);
      setInfoMessage(formatTranslation(t("pendingTransactionsPage.syncSuccess"), result.synced));
      if (result.failed > 0) {
        setErrorMessage(formatTranslation(t("pendingTransactionsPage.syncFailed"), result.failed));
      }
      setSelectedIds([]);
      await refreshPendingTransactions();
    },
  });

  const selectedCount = validSelectedIds.length;
  const allSelected = pendingTransactions.length > 0 && selectedCount === pendingTransactions.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < pendingTransactions.length;
  const selectedSubmissions = useMemo(
    () => pendingTransactions.filter((submission) => validSelectedIds.includes(submission.id)),
    [pendingTransactions, validSelectedIds],
  );
  const tagOptions = useMemo(
    () =>
      metadataSnapshot?.tags
        ?.map((tag) => tag.name.trim())
        .filter((value) => value.length > 0)
        .filter((value, index, array) => array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .sort((a, b) => a.localeCompare(b)),
    [metadataSnapshot],
  );

  const toggleSelected = (submissionId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(submissionId) ? current : [...current, submissionId];
      }

      return current.filter((id) => id !== submissionId);
    });
  };

  const openSubmissionEditor = (submission: PendingTransactionSubmissionDto) => {
    setEditingSubmission(submission);
  };

  const closeEditor = () => {
    setEditingSubmission(null);
  };

  const handleSaveSubmission = (record: Omit<OfflineTransactionRecord, "updatedAt">) => {
    if (editingSubmission == null) {
      return;
    }

    void updateMutation.mutateAsync({
      id: editingSubmission.id,
      record,
    });
  };

  const renderEditorDrawer = () => {
    if (editingSubmission == null) {
      return null;
    }

    const transaction = editingSubmission.payload;
    const isOpen = editingSubmission != null;

    if (transaction.type === "CashFlow") {
      return (
        <OfflineCashFlowFormDrawer
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
          tagOptions={tagOptions}
        />
      );
    }

    if (transaction.type === "BankAccount") {
      return (
        <OfflineBankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
          tagOptions={tagOptions}
        />
      );
    }

    if (transaction.type === "Transfer") {
      return (
        <OfflineTransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
          tagOptions={tagOptions}
        />
      );
    }

    return (
      <OfflineExchangeFormDrawer
        currencies={currencies}
        editingTransaction={transaction}
        isOpen={isOpen}
        onClose={closeEditor}
        onSave={handleSaveSubmission}
        tagOptions={tagOptions}
      />
    );
  };

  const deleteSelected = async () => {
    void (async () => {
      try {
        setErrorMessage(null);
        setIsBulkDeleting(true);
        await Promise.all(selectedIds.map((id) => deletePendingTransaction(id)));
        setSelectedIds([]);
        await refreshPendingTransactions();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.errorDeleting"));
      } finally {
        setIsBulkDeleting(false);
      }
    })();
  };

  const syncSelected = async () => {
    await syncMutation.mutateAsync(selectedIds);
  };

  return {
    allSelected,
    closeEditor,
    counterparties,
    currencies,
    deleteSelected,
    deleteSubmission: (id: string) => {
      void deleteMutation.mutateAsync(id);
    },
    dismissError: () => setErrorMessage(null),
    dismissInfo: () => setInfoMessage(null),
    errorMessage,
    formatAmount: (value: number) => value.toLocaleString(),
    formatTimestamp: (value: string | null | undefined) => {
      if (value == null || value.length === 0) {
        return "-";
      }

      return new Date(value).toLocaleString();
    },
    infoMessage,
    isBulkDeleting,
    isIndeterminate,
    isLoading,
    isSyncing: syncMutation.isPending,
    openSubmissionEditor,
    pendingTransactions,
    renderEditorDrawer,
    selectedCount,
    selectedIds,
    selectedSubmissions,
    setSelectedIds,
    syncSelected,
    toggleSelected,
  };
}
