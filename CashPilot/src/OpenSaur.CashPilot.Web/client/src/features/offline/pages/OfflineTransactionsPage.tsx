import { useEffect, useMemo, useState } from "react";
import { Alert, Grid, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { Banknote, Landmark, Repeat, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { DropDown } from "../../../components/atoms/DropDown";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TransactionListPanel } from "../../transactions/components/TransactionListPanel";
import { type TransactionFilterValues } from "../../transactions/components/TransactionsFilterDrawer";
import { loadOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import {
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

type TemplatePickerValues = {
  templateId: string;
};

const ITEMS_PER_PAGE = 30;

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
  const { data: currentProfile } = useCurrentProfileQuery();
  const [refreshToken, setRefreshToken] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const filters = useMemo<TransactionFilterValues>(() => {
    const now = new Date();

    return {
      description: "",
      fromDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      rangePreset: "Month",
      toDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`,
      types: ["CashFlow", "BankAccount", "Transfer", "Exchange"],
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

  const metadataSnapshot = loadOfflineMetadataSnapshot();
  const offlineTransactions = useMemo(() => loadOfflineTransactions(), [refreshToken]);
  const offlineTemplates = useMemo(() => loadOfflineTemplates(), [refreshToken]);
  const currencies = metadataSnapshot?.currencies ?? [];
  const banks = metadataSnapshot?.banks ?? [];
  const counterparties = metadataSnapshot?.counterparties ?? [];
  const transactionItems = useMemo(
    () => offlineTransactions.map((transaction) => buildTransactionListItem(transaction, currencies)),
    [currencies, offlineTransactions],
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

  const headerActions = (
    <ActionButton
      onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
      variant="contained"
    >
      {t("transactions.create")}
    </ActionButton>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("offline.transactionsTitle")}
    >
      <Stack spacing={3}>
        {error != null ? <Alert severity="error">{error}</Alert> : null}

        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionListPanel
              formatAmount={formatAmount}
              formatDate={formatDate}
              isLoading={false}
              onDelete={(item) => {
                const record = offlineTransactions.find((transaction) => transaction.id === item.id && transaction.type === item.type);
                if (record != null) {
                  setDeletingTransaction(record);
                }
              }}
              onEdit={(type, id) => {
                const record = offlineTransactions.find((transaction) => transaction.id === id && transaction.type === type);
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
                      filterable
                      label=""
                      name="templateId"
                      placeholder="Please select"
                      options={offlineTemplates.map((template) => ({
                        icon: typeIcon(template.templateType),
                        label: template.name,
                        textColor: typeColor(template.templateType),
                        value: template.id,
                      }))}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <ActionButton disabled={!selectedTemplateId} onClick={() => handlePopulateTemplate()}>
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
          message={deletingTransaction == null ? "" : `${deletingTransaction.type} - ${deletingTransaction.description || "-"}`}
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
        />

        <OfflineBankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "BankAccount" ? editingTransaction : null}
          isOpen={isBankAccountDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
        />

        <OfflineTransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Transfer" ? editingTransaction : null}
          isOpen={isTransferDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
        />

        <OfflineExchangeFormDrawer
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Exchange" ? editingTransaction : null}
          isOpen={isExchangeDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
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
