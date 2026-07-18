import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TranslationKey } from "../../settings/provider/translations";
import { loadOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import {
  clearOfflineTransactions,
  loadOfflineTransactions,
  removeOfflineTransaction,
  upsertOfflineTransaction,
  type OfflineTransactionRecord,
  type OfflineTransactionType,
} from "../storages/offlineTransactionsStore";
import { loadOfflineTemplates } from "../storages/offlineTemplatesStore";
import { buildTransactionListItem } from "../services/offlineTransactionFormUtils";
import { submitPendingTransactions } from "../../pending/api/pendingTransactionsApi";
import { syncOfflineMetadata } from "../services/offlineMetadataSyncService";
import type { TransactionFilterValues } from "../../transactions/components/TransactionsFilterDrawer";

type TemplatePickerValues = {
  templateId: string;
};

const ITEMS_PER_PAGE = 30;

export function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

export function typeIcon(templateType: number) {
  if (templateType === 1) return "CashFlow";
  if (templateType === 2) return "Transfer";
  if (templateType === 3) return "Exchange";
  return "BankAccount";
}

export function useOfflineTransactionsPageLogic() {
  const { t } = useSettings();
  const { authSession } = useAuthSession();
  const { data: currentProfile } = useCurrentProfileQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const submitReviewRequested = searchParams.get("submitReview") === "1";
  const importMetadataRequested = searchParams.get("importMetadata") === "1";
  const submitReviewInFlight = useRef(false);
  const importMetadataInFlight = useRef(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isImportingMetadata, setIsImportingMetadata] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [statusMessageKey, setStatusMessageKey] = useState<TranslationKey | null>(null);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const filters = useMemo<TransactionFilterValues>(() => {
    return {
      description: "",
      fromDate: "",
      rangePreset: "Custom" as const,
      toDate: "",
      types: ["CashFlow", "BankAccount", "Transfer", "Exchange"],
      showOnlyInitialDeposits: false,
    };
  }, []);
  const [deletingTransaction, setDeletingTransaction] = useState<OfflineTransactionRecord | null>(null);
  const [isCashFlowDrawerOpen, setIsCashFlowDrawerOpen] = useState(false);
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isExchangeDrawerOpen, setIsExchangeDrawerOpen] = useState(false);
  const [isTemplatePopulateDrawerOpen, setIsTemplatePopulateDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<OfflineTransactionRecord | null>(null);
  const [populateTemplateId, setPopulateTemplateId] = useState("");

  const templatePickerForm = useForm<TemplatePickerValues>({
    defaultValues: { templateId: "" },
  });

  const selectedTemplateId = useWatch({ control: templatePickerForm.control, name: "templateId" });

  const metadataSnapshot = loadOfflineMetadataSnapshot(currentProfile?.id);
  const ownerUserId = currentProfile?.id ?? null;
  const offlineTransactions = useMemo(() => {
    // We use refreshToken to force re-computation when a manual refresh is needed
    void refreshToken;
    return loadOfflineTransactions();
  }, [refreshToken]);
  const offlineTemplates = useMemo(() => {
    void refreshToken;
    return loadOfflineTemplates(ownerUserId);
  }, [ownerUserId, refreshToken]);

  const visibleTransactions = useMemo<OfflineTransactionRecord[]>(() => {
    if (!authSession || !currentProfile) return offlineTransactions;

    const currentUserId = currentProfile.id ?? "";
    return offlineTransactions.filter((x) => x.userId === null || x.userId === currentUserId);
  }, [offlineTransactions, authSession, currentProfile]);

  const hasOfflineMetadata = metadataSnapshot != null;
  const hasOfflineTransactions = visibleTransactions.length > 0;
  const currencies = useMemo(() => metadataSnapshot?.currencies ?? [], [metadataSnapshot]);
  const banks = useMemo(() => metadataSnapshot?.banks ?? [], [metadataSnapshot]);
  const counterparties = useMemo(() => metadataSnapshot?.counterparties ?? [], [metadataSnapshot]);
  const tagOptions = useMemo(
    () =>
      metadataSnapshot?.tags
        ?.map((tag) => tag.name.trim())
        .filter((value) => value.length > 0)
        .filter((value, index, array) => array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .sort((a, b) => a.localeCompare(b)),
    [metadataSnapshot],
  );
  const transactionItems = useMemo(
    () => visibleTransactions?.map((transaction) => buildTransactionListItem(transaction, currencies)) ?? [],
    [currencies, visibleTransactions],
  );

  useEffect(() => {
    if (offlineTemplates.length === 0) {
      templatePickerForm.setValue("templateId", "");
      return;
    }

    if (selectedTemplateId && !offlineTemplates.some((template) => template.id === selectedTemplateId)) {
      templatePickerForm.setValue("templateId", "");
    }
  }, [offlineTemplates, selectedTemplateId, templatePickerForm]);

  useEffect(() => {
    if (page > Math.max(1, Math.ceil(transactionItems.length / ITEMS_PER_PAGE))) {
      setPage(1);
    }
  }, [page, transactionItems.length]);

  const filteredTransactions = useMemo(() => {
    const normalizedDescription = filters.description.trim().toLowerCase();

    return transactionItems.filter((item) => {
      if (filters.types.length > 0 && !filters.types.includes(item.type)) {
        return false;
      }

      if (filters.fromDate.length > 0 && item.transactionDate < filters.fromDate) {
        return false;
      }

      if (filters.toDate.length > 0 && item.transactionDate > filters.toDate) {
        return false;
      }

      if (normalizedDescription.length > 0) {
        const description = (item.description ?? "").toLowerCase();
        if (!description.includes(normalizedDescription)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, transactionItems]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const pagedTransactions = useMemo(
    () => filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredTransactions, page],
  );

  const saveTransaction = (record: Omit<OfflineTransactionRecord, "updatedAt">) => {
    try {
      setError(null);
      upsertOfflineTransaction({
        ...record,
        userId: currentProfile?.id ?? record.userId,
      });
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("offline.saveError"));
    }
  };

  const openCreateDrawer = (type: OfflineTransactionType) => {
    setEditingTransaction(null);
    setPopulateTemplateId("");
    setIsTemplatePopulateDrawerOpen(false);
    setIsCashFlowDrawerOpen(type === "CashFlow");
    setIsBankAccountDrawerOpen(type === "BankAccount");
    setIsTransferDrawerOpen(type === "Transfer");
    setIsExchangeDrawerOpen(type === "Exchange");
  };

  const openEditDrawer = (record: OfflineTransactionRecord) => {
    setEditingTransaction(record);
    setPopulateTemplateId("");
    setIsTemplatePopulateDrawerOpen(false);
    setIsCashFlowDrawerOpen(record.type === "CashFlow");
    setIsBankAccountDrawerOpen(record.type === "BankAccount");
    setIsTransferDrawerOpen(record.type === "Transfer");
    setIsExchangeDrawerOpen(record.type === "Exchange");
  };

  const handlePopulateTemplate = (templateId = selectedTemplateId) => {
    if (templateId.length === 0) {
      return;
    }

    setEditingTransaction(null);
    setPopulateTemplateId(templateId);
    setIsCashFlowDrawerOpen(false);
    setIsBankAccountDrawerOpen(false);
    setIsTransferDrawerOpen(false);
    setIsExchangeDrawerOpen(false);
    setIsTemplatePopulateDrawerOpen(true);
  };

  const closeDrawers = () => {
    setIsCashFlowDrawerOpen(false);
    setIsBankAccountDrawerOpen(false);
    setIsTransferDrawerOpen(false);
    setIsExchangeDrawerOpen(false);
    setIsTemplatePopulateDrawerOpen(false);
    setEditingTransaction(null);
    setPopulateTemplateId("");
  };

  const importMetadata = useCallback(async () => {
    if (importMetadataInFlight.current) {
      return;
    }

    importMetadataInFlight.current = true;
    setIsImportingMetadata(true);

    try {
      setError(null);
      setStatusMessageKey(null);
      await syncOfflineMetadata(ownerUserId);
      setRefreshToken((value) => value + 1);
      setStatusMessageKey("offline.importSuccess");
    } catch (error) {
      setError(error instanceof Error ? error.message : t("offline.importFailed"));
    } finally {
      importMetadataInFlight.current = false;
      setIsImportingMetadata(false);
    }
  }, [ownerUserId, t, setIsImportingMetadata, setError, setStatusMessageKey, setRefreshToken]);

  const submitForReview = useCallback(async () => {
    if (submitReviewInFlight.current) {
      return;
    }

    submitReviewInFlight.current = true;
    setIsSubmittingReview(true);
    try {
      setError(null);
      setStatusMessageKey(null);
      const transactions = currentProfile?.id == null
        ? loadOfflineTransactions()
        : loadOfflineTransactions().filter((transaction) => transaction.userId == null || transaction.userId === currentProfile.id);
      await submitPendingTransactions(transactions);
      clearOfflineTransactions();
      setRefreshToken((value) => value + 1);
      setStatusMessageKey("offline.submitSuccess");
      navigate("/offline/transactions", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : t("offline.submitFailed"));
    } finally {
      submitReviewInFlight.current = false;
      setIsSubmittingReview(false);
    }
  }, [currentProfile, navigate, t, setError, setRefreshToken, setStatusMessageKey, submitReviewInFlight]);

  const handleDeleteConfirmed = () => {
    if (deletingTransaction == null) {
      return;
    }

    removeOfflineTransaction(deletingTransaction.id);
    setRefreshToken((value) => value + 1);
    setDeletingTransaction(null);
  };

  useEffect(() => {
    if (importMetadataRequested) {
      if (authSession == null) {
        navigate("/prepare-session", {
          state: {
            returnTo: `${location.pathname}?importMetadata=1`,
          },
        });
        return;
      }

      if (ownerUserId == null) {
        return;
      }

      void importMetadata();
      return;
    }

    if (!submitReviewRequested) {
      return;
    }

    if (authSession == null) {
      navigate("/prepare-session", {
        state: {
          returnTo: `${location.pathname}?submitReview=1`,
        },
      });
      return;
    }

    void submitForReview();
  }, [authSession, importMetadataRequested, location.pathname, navigate, ownerUserId, submitReviewRequested, importMetadata, submitForReview]);

  return {
    banks,
    counterparties,
    currencies,
    deletingTransaction,
    error,
    filters,
    formatMessage,
    hasOfflineMetadata,
    hasOfflineTransactions,
    importMetadata,
    isBankAccountDrawerOpen,
    isCashFlowDrawerOpen,
    isExchangeDrawerOpen,
    isImportingMetadata,
    isSubmittingReview,
    isTemplatePopulateDrawerOpen,
    isTransferDrawerOpen,
    editingTransaction,
    metadataSnapshot,
    offlineTemplates,
    page,
    pageCount,
    pagedTransactions,
    populateTemplateId,
    selectedTemplateId,
    setCreateMenuAnchor,
    setDeletingTransaction,
    setPage,
    setError,
    setStatusMessageKey,
    statusMessageKey,
    submitForReview,
    tagOptions,
    templatePickerForm,
    transactionItems,
    typeColor: (templateType: number) => {
      if (templateType === 1) return "var(--tx-type-cashflow-color)";
      if (templateType === 2) return "var(--tx-type-transfer-color)";
      if (templateType === 3) return "var(--tx-type-exchange-color)";
      return "var(--tx-type-bankaccount-color)";
    },
    visibleTransactions,
    openCreateDrawer,
    openEditDrawer,
    handlePopulateTemplate,
    closeDrawers,
    saveTransaction,
    createMenuAnchor,
    handleDeleteConfirmed,
  };
}
