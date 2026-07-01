import { useEffect, useMemo, useRef, useState } from "react";
import { Grid, IconButton, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { Banknote, ChevronDown, Landmark, Repeat, Users } from "lucide-react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { DropDown } from "../../../components/atoms/DropDown";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TranslationKey } from "../../settings/provider/translations";
import { TransactionListPanel } from "../../transactions/components/TransactionListPanel";
import { type TransactionFilterValues } from "../../transactions/components/TransactionsFilterDrawer";
import { loadOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import {
  clearOfflineTransactions,
  loadOfflineTransactions,
  removeOfflineTransaction,
  upsertOfflineTransaction,
  type OfflineTransactionRecord,
  type OfflineTransactionType,
} from "../storages/offlineTransactionsStore";
import {
  loadOfflineTemplates,
} from "../storages/offlineTemplatesStore";
import { buildTransactionListItem } from "../services/offlineTransactionFormUtils";
import { OfflineCashFlowFormDrawer } from "../components/OfflineCashFlowFormDrawer";
import { OfflineBankAccountFormDrawer } from "../components/OfflineBankAccountFormDrawer";
import { OfflineTransferFormDrawer } from "../components/OfflineTransferFormDrawer";
import { OfflineExchangeFormDrawer } from "../components/OfflineExchangeFormDrawer";
import { OfflineTemplatePopulateDrawer } from "../components/populate/OfflineTemplatePopulateDrawer";
import { submitPendingTransactions } from "../../pending/api/pendingTransactionsApi";
import { syncOfflineMetadata } from "../services/offlineMetadataSyncService";

type TemplatePickerValues = {
  templateId: string;
};

const ITEMS_PER_PAGE = 30;

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

function typeIcon(templateType: number) {
  if (templateType === 1) return <Banknote size={16} />;
  if (templateType === 2) return <Users size={16} />;
  if (templateType === 3) return <Repeat size={16} />;
  return <Landmark size={16} />;
}

function typeColor(templateType: number) {
  if (templateType === 1) return "var(--tx-type-cashflow-color)";
  if (templateType === 2) return "var(--tx-type-transfer-color)";
  if (templateType === 3) return "var(--tx-type-exchange-color)";
  return "var(--tx-type-bankaccount-color)";
}

export function OfflineTransactionsPage() {
  const { formatAmount, formatDate, t } = useSettings();
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
  const selectedTemplateId = templatePickerForm.watch("templateId");

  const metadataSnapshot = loadOfflineMetadataSnapshot(currentProfile?.id);
  const offlineTransactions = useMemo(() => loadOfflineTransactions(), [refreshToken]);
  const offlineTemplates = useMemo(() => loadOfflineTemplates(), [refreshToken]);

  // Filter to only this user's transactions or unassigned ones for editing.
  // This prevents showing other users' data after auth redirects from import/submitReview buttons.
  const visibleTransactions = useMemo<OfflineTransactionRecord[]>(() => {
    if (!authSession || !currentProfile) return offlineTransactions;

    const currentUserId = currentProfile.id ?? "";

    // Filter to this user's transactions or unowned (for creating new ones when no data yet)
    return offlineTransactions.filter((x) => x.userId === null || x.userId === currentUserId);
  }, [offlineTransactions, authSession, currentProfile]);

  const hasOfflineMetadata = metadataSnapshot != null;
  const hasOfflineTransactions = visibleTransactions.length > 0;
  const currencies = metadataSnapshot?.currencies ?? [];
  const banks = metadataSnapshot?.banks ?? [];
  const counterparties = metadataSnapshot?.counterparties ?? [];
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

  const importMetadata = async () => {
    if (importMetadataInFlight.current) {
      return;
    }

    importMetadataInFlight.current = true;
    setIsImportingMetadata(true);

    try {
      setError(null);
      setStatusMessageKey(null);
      await syncOfflineMetadata(currentProfile?.id);
      setRefreshToken((value) => value + 1);
      setStatusMessageKey("offline.importSuccess");
    } catch (error) {
      setError(error instanceof Error ? error.message : t("offline.importFailed"));
    } finally {
      importMetadataInFlight.current = false;
      setIsImportingMetadata(false);
    }
  };

  const submitForReview = async () => {
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
  }, [authSession, importMetadataRequested, location.pathname, navigate, submitReviewRequested]);

  const headerActions = (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
        <ActionButton
          disabled={isImportingMetadata}
          sx={{ px: { xs: 1.5, sm: 2 } }}
          onClick={() => {
            if (authSession == null) {
              navigate("/prepare-session", {
                state: {
                  returnTo: `${location.pathname}?importMetadata=1`,
                },
              });
              return;
            }

            void importMetadata();
          }}
          variant="outlined"
        >
          {isImportingMetadata ? t("offline.importing") : t("offline.importAction")}
        </ActionButton>
        <ActionButton
          disabled={isSubmittingReview || !hasOfflineTransactions || !hasOfflineMetadata}
          sx={{ px: { xs: 1.5, sm: 2 } }}
          onClick={() => {
            if (authSession == null) {
              navigate("/prepare-session", {
                state: {
                  returnTo: `${location.pathname}?submitReview=1`,
                },
              });
              return;
            }

            void submitForReview();
          }}
          variant="outlined"
        >
          {isSubmittingReview ? t("offline.submittingReview") : t("offline.submitForReview")}
        </ActionButton>
      <ActionButton
        disabled={!hasOfflineMetadata}
        endIcon={<ChevronDown size={16} />}
        sx={{ px: { xs: 1.5, sm: 2 } }}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
        variant="contained"
      >
        {t("transactions.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("offline.transactionsTitle")}
    >
      <Stack spacing={3}>
        {error != null ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(244,67,54,0.20)", backgroundColor: "rgba(244,67,54,0.06)", p: 2 }}>
            <Typography color="error.main" sx={{ fontWeight: 700 }}>{error}</Typography>
          </Paper>
        ) : null}
        {statusMessageKey != null ? (
          <Paper
            elevation={0}
            sx={{
              alignItems: "center",
              border: "1px solid rgba(76,175,80,0.20)",
              backgroundColor: "rgba(76,175,80,0.06)",
              display: "flex",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Typography color="success.main" sx={{ fontWeight: 700 }}>
              {t(statusMessageKey)}
            </Typography>
            <IconButton
              aria-label={t("common.dismissMessage")}
              onClick={() => setStatusMessageKey(null)}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}
        {!hasOfflineMetadata ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(33,150,243,0.20)", backgroundColor: "rgba(33,150,243,0.06)", p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>{t("offline.importTitle")}</Typography>
            <Typography color="text.secondary">{t("offline.importDescription")}</Typography>
          </Paper>
        ) : null}

        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionListPanel
              formatAmount={formatAmount}
              formatDate={formatDate}
              isActionDisabled={!hasOfflineMetadata}
              isLoading={false}
              onDelete={(item) => {
                const record = visibleTransactions?.find((transaction) => transaction.id === item.id && transaction.type === item.type);
                if (record != null) {
                  setDeletingTransaction(record);
                }
              }}
              onEdit={(type, id) => {
                const record = visibleTransactions?.find((transaction) => transaction.id === id && transaction.type === type);
                if (record != null) {
                  openEditDrawer(record);
                }
              }}
              onPageChange={setPage}
              page={page}
              pageCount={pageCount}
              pagedTransactions={pagedTransactions}
              t={t}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="h6">{t("templates.title")}</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <DropDown
                      control={templatePickerForm.control}
                      disabled={!hasOfflineMetadata}
                      filterable
                      label=""
                      name="templateId"
                      placeholder={t("common.pleaseSelect")}
                      options={offlineTemplates.map((template) => ({
                        icon: typeIcon(template.templateType),
                        label: template.name,
                        textColor: typeColor(template.templateType),
                        value: template.id,
                      }))}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <ActionButton disabled={!selectedTemplateId || !hasOfflineMetadata} onClick={() => handlePopulateTemplate()}>
                        {t("templates.populate")}
                      </ActionButton>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Menu
          anchorEl={createMenuAnchor}
          onClose={() => setCreateMenuAnchor(null)}
          open={createMenuAnchor != null}
        >
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("CashFlow");
            }}
          >
            {t("transactions.cashFlow")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("BankAccount");
            }}
          >
            {t("transactions.bankAccount")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("Transfer");
            }}
          >
            {t("transactions.transfer")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("Exchange");
            }}
          >
            {t("transactions.exchange")}
          </MenuItem>
        </Menu>

        <ConfirmModal
          confirmLabel={t("transactions.delete")}
          isConfirming={false}
          message={deletingTransaction == null
            ? ""
            : formatMessage(t("offline.deleteConfirmMessage"), {
              description: deletingTransaction.description || t("common.none"),
              type: deletingTransaction.type,
            })}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={() => {
            if (deletingTransaction == null) {
              return;
            }

            removeOfflineTransaction(deletingTransaction.id);
            setRefreshToken((value) => value + 1);
            setDeletingTransaction(null);
          }}
          open={deletingTransaction != null}
          title={t("transactions.deleteTitle")}
        />

        <OfflineCashFlowFormDrawer
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "CashFlow" ? editingTransaction : null}
          isOpen={isCashFlowDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineBankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "BankAccount" ? editingTransaction : null}
          isOpen={isBankAccountDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineTransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Transfer" ? editingTransaction : null}
          isOpen={isTransferDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineExchangeFormDrawer
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Exchange" ? editingTransaction : null}
          isOpen={isExchangeDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineTemplatePopulateDrawer
          banks={banks}
          counterparties={counterparties}
          currencies={currencies}
          initialTemplateId={populateTemplateId}
          isOpen={isTemplatePopulateDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
        />
      </Stack>
    </DefaultLayout>
  );
}
