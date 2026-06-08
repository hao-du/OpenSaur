import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Grid, Menu, MenuItem, Stack } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import {
  getBankAccountFormById,
  getCashFlowById,
  getCurrencyExchangeById,
  getTransferFormById,
} from "../api/transactionsApi";
import type { CashFlowDetailDto, SaveBankAccountFormRequestDto, TransactionListItemDto } from "../dtos/TransactionDto";
import type { ExchangeDraft, TransactionDeleteTarget, TransactionType, TransferMovementDraft } from "../dtos/TransactionPageState";
import { useCreateCashFlowMutation } from "../hooks/useCreateCashFlowMutation";
import { useCreateCurrencyExchangeMutation } from "../hooks/useCreateCurrencyExchangeMutation";
import { useDeleteTransactionMutation } from "../hooks/useDeleteTransactionMutation";
import { useAutoTagMutation } from "../hooks/useAutoTagMutation";
import { useSaveBankAccountMutation } from "../hooks/useSaveBankAccountMutation";
import { useSaveTransferMutation } from "../hooks/useSaveTransferMutation";
import { useTemplatesQuery } from "../../templates/hooks/useTemplatesQuery";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useTransactionDashboardQuery } from "../hooks/useTransactionDashboardQuery";
import { useUpdateCashFlowMutation } from "../hooks/useUpdateCashFlowMutation";
import { useUpdateCurrencyExchangeMutation } from "../hooks/useUpdateCurrencyExchangeMutation";
import { CashFlowFormDrawer } from "../components/CashFlowFormDrawer";
import { BankAccountFormDrawer } from "../components/BankAccountFormDrawer";
import { TransferFormDrawer } from "../components/TransferFormDrawer";
import { ExchangeFormDrawer } from "../components/ExchangeFormDrawer";
import { TransactionDashboardPanel } from "../components/TransactionDashboardPanel";
import { TransactionListPanel } from "../components/TransactionListPanel";
import {
  TransactionsFilterDrawer,
  type TransactionFilterValues,
} from "../components/TransactionsFilterDrawer";

const ITEMS_PER_PAGE = 30;

export function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const [isCashFlowDrawerOpen, setIsCashFlowDrawerOpen] = useState(false);
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isExchangeDrawerOpen, setIsExchangeDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlowDetailDto | null>(null);
  const [editingBankAccount, setEditingBankAccount] =
    useState<SaveBankAccountFormRequestDto | null>(null);
  const [editingTransferMovement, setEditingTransferMovement] = useState<TransferMovementDraft | null>(null);
  const [editingExchange, setEditingExchange] = useState<ExchangeDraft | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDeleteTarget | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { formatAmount, formatDate, t } = useSettings();
  const createCashFlowMutation = useCreateCashFlowMutation();
  const updateCashFlowMutation = useUpdateCashFlowMutation();
  const saveBankAccountMutation = useSaveBankAccountMutation();
  const saveTransferMutation = useSaveTransferMutation();
  const createCurrencyExchangeMutation = useCreateCurrencyExchangeMutation();
  const updateCurrencyExchangeMutation = useUpdateCurrencyExchangeMutation();
  const deleteTransactionMutation = useDeleteTransactionMutation();
  const autoTagMutation = useAutoTagMutation();
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const [filters, setFilters] = useState<TransactionFilterValues>({
    description: "",
    fromDate: startOfMonth,
    rangePreset: "Month",
    toDate: endOfMonth,
    types: ["CashFlow", "BankAccount", "Transfer", "Exchange"],
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

  const banks =
    useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const currencies =
    useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const counterparties =
    useCounterpartiesQuery({
      isActive: true,
      fullName: "",
      email: "",
      phoneNumber: "",
    }).data ?? [];
  const templates =
    useTemplatesQuery({
      isActive: true,
      name: "",
      templateType: "",
    }).data ?? [];
  const transactionsQuery = useTransactionsQuery();
  const dashboardQuery = useTransactionDashboardQuery();
  const defaultCurrencyCode = currencies.find((x) => x.isDefault)?.shortName;
  const incomeOutcomeTitle =
    defaultCurrencyCode == null
      ? t("transactions.incomeOutcome")
      : `${t("transactions.incomeOutcome")} (${defaultCurrencyCode})`;
  const incomeOutcomeItems =
    defaultCurrencyCode == null
      ? (dashboardQuery.data?.incomeOutcomes ?? [])
      : (dashboardQuery.data?.incomeOutcomes ?? []).filter(
          (x) => x.currencyCode === defaultCurrencyCode,
        );
  const isTransactionsLoading =
    transactionsQuery.isLoading ||
    transactionsQuery.isFetching ||
    !transactionsQuery.data;
  const isDashboardLoading =
    dashboardQuery.isLoading ||
    dashboardQuery.isFetching ||
    !dashboardQuery.data;
  const isCurrenciesLoading =
    currencies.length === 0 && (isDashboardLoading || isTransactionsLoading);

  const filteredTransactions = useMemo(() => {
    const normalizedDescription = filters.description.trim().toLowerCase();
    return (transactionsQuery.data ?? []).filter((item) => {
      if (filters.types.length > 0 && !filters.types.includes(item.type)) {
        return false;
      }
      if (
        filters.fromDate.length > 0 &&
        item.transactionDate < filters.fromDate
      ) {
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
  }, [transactionsQuery.data, filters]);

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

  const submit = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transactions.errorSave"));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deletingTransaction == null) {
      return;
    }

    try {
      setIsDeleteConfirming(true);
      await submit(() =>
        deleteTransactionMutation.mutateAsync({
          id: deletingTransaction.id,
          type: deletingTransaction.type,
        }),
      );
      setDeletingTransaction(null);
    } finally {
      setIsDeleteConfirming(false);
    }
  };

  const handleEdit = async (
    type: TransactionType,
    id: string,
    transferId?: string | null,
    suggestedTags?: string[],
  ) => {
    try {
      setError(null);
      if (type === "CashFlow") {
        const detail = await getCashFlowById(id);
        setEditingCashFlow(suggestedTags == null ? detail : { ...detail, tags: suggestedTags });
        setIsCashFlowDrawerOpen(true);
        return;
      }

      if (type === "BankAccount") {
        const bankAccount = await getBankAccountFormById(id);
        setEditingBankAccount(suggestedTags == null ? bankAccount : { ...bankAccount, tags: suggestedTags });
        setIsBankAccountDrawerOpen(true);
        return;
      }

      if (type === "Transfer") {
        const transferForm = await getTransferFormById(transferId ?? id);
        setEditingTransferMovement({
          amount: transferForm.amount,
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
          transactionDate: transferForm.transactionDate,
          transferType: transferForm.transferType,
          tags: suggestedTags ?? transferForm.tags,
          transactionItems: transferForm.transactionItems ?? []
        });
        setIsTransferDrawerOpen(true);
        return;
      }

      const detail = await getCurrencyExchangeById(id);
        setEditingExchange({
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
          transactionItems: detail.transactionItems ?? []
        });
      setIsExchangeDrawerOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transactions.errorSave"));
    }
  };

  const requestAutoTags = async (
    description: string | null | undefined,
    existingTags: string[] | null | undefined,
    transactionType: TransactionType,
  ) => {
    try {
      setError(null);
      const response = await autoTagMutation.mutateAsync({
        description,
        existingTags: existingTags ?? [],
        transactionType,
      });

      return response.tags;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transactions.errorAutoTag"));
      return existingTags ?? [];
    }
  };

  const handleAutoTagListItem = async (item: TransactionListItemDto) => {
    const tags = await requestAutoTags(item.description, item.tags ?? [], item.type);
    await handleEdit(item.type, item.id, item.transferId, tags);
  };

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => setIsFilterDrawerOpen(true)}
        variant="outlined"
      >
        {t("transactions.filter")}
      </ActionButton>
      <ActionButton
        endIcon={<ChevronDown size={16} />}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
        variant="contained"
      >
        {t("transactions.create")}
      </ActionButton>
      <Menu
        anchorEl={createMenuAnchor}
        onClose={() => setCreateMenuAnchor(null)}
        open={createMenuAnchor != null}
      >
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            setIsCashFlowDrawerOpen(true);
          }}
        >
          {t("transactions.cashFlow")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            setEditingBankAccount(null);
            setIsBankAccountDrawerOpen(true);
          }}
        >
          {t("transactions.bankAccount")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            setIsTransferDrawerOpen(true);
          }}
        >
          {t("transactions.transfer")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            setIsExchangeDrawerOpen(true);
          }}
        >
          {t("transactions.exchange")}
        </MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("transactions.title")}
    >
      <Stack spacing={3}>
        {error != null ? <Alert severity="error">{error}</Alert> : null}

        <CashFlowFormDrawer
          currencies={currencies}
          editingCashFlow={editingCashFlow}
          isAutoTagging={autoTagMutation.isPending}
          isOpen={isCashFlowDrawerOpen}
          onClose={() => {
            setIsCashFlowDrawerOpen(false);
            setEditingCashFlow(null);
          }}
          onSubmit={(payload) =>
            submit(() => createCashFlowMutation.mutateAsync(payload))
          }
          onAutoTag={requestAutoTags}
          onUpdate={(id, payload) =>
            submit(() => updateCashFlowMutation.mutateAsync({ id, payload }))
          }
        />

        <BankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingBankAccount={editingBankAccount}
          isAutoTagging={autoTagMutation.isPending}
          isOpen={isBankAccountDrawerOpen}
          onClose={() => {
            setIsBankAccountDrawerOpen(false);
            setEditingBankAccount(null);
          }}
          onSave={(payload) =>
            submit(() => saveBankAccountMutation.mutateAsync(payload))
          }
          onAutoTag={requestAutoTags}
        />

        <TransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingMovement={editingTransferMovement}
          isAutoTagging={autoTagMutation.isPending}
          isOpen={isTransferDrawerOpen}
          onClose={() => {
            setIsTransferDrawerOpen(false);
            setEditingTransferMovement(null);
          }}
          onSave={(payload) =>
            submit(() => saveTransferMutation.mutateAsync(payload))
          }
          onAutoTag={requestAutoTags}
        />

        <ExchangeFormDrawer
          currencies={currencies}
          editingExchange={editingExchange}
          isAutoTagging={autoTagMutation.isPending}
          isOpen={isExchangeDrawerOpen}
          onClose={() => {
            setIsExchangeDrawerOpen(false);
            setEditingExchange(null);
          }}
          onSubmit={(payload) =>
            submit(() => createCurrencyExchangeMutation.mutateAsync(payload))
          }
          onAutoTag={requestAutoTags}
          onUpdate={(id, payload) =>
            submit(() =>
              updateCurrencyExchangeMutation.mutateAsync({ id, payload }),
            )
          }
        />
        <TransactionsFilterDrawer
          initialValues={filters}
          isOpen={isFilterDrawerOpen}
          onApply={(values) => {
            setFilters(values);
            setIsFilterDrawerOpen(false);
          }}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
        <ConfirmModal
          confirmLabel={t("transactions.delete")}
          isConfirming={isDeleteConfirming}
          message={t("transactions.deleteConfirm")
            .replace("{type}", deletingTransaction?.type ?? "")
            .replace("{name}", deletingTransaction?.description ?? "-")}
          onClose={() => {
            if (isDeleteConfirming) {
              return;
            }

            setDeletingTransaction(null);
          }}
          onConfirm={() => {
            void handleDeleteConfirmed();
          }}
          open={deletingTransaction != null}
          title={t("transactions.deleteTitle")}
        />

        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionListPanel
              formatAmount={formatAmount}
              formatDate={formatDate}
              isAutoTagging={autoTagMutation.isPending}
              isLoading={isTransactionsLoading}
              onAutoTag={(item) => {
                void handleAutoTagListItem(item);
              }}
              onDelete={(item) => {
                setDeletingTransaction({
                  description: item.description,
                  id: item.id,
                  type: item.type,
                });
              }}
              onEdit={(type, id, transferId) => {
                void handleEdit(type, id, transferId);
              }}
              page={page}
              pageCount={pageCount}
              pagedTransactions={pagedTransactions}
              onPageChange={setPage}
              t={t}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionDashboardPanel
              banks={banks}
              counterparties={counterparties}
              currencies={currencies}
              dashboard={dashboardQuery.data}
              incomeOutcomeItems={incomeOutcomeItems}
              incomeOutcomeTitle={incomeOutcomeTitle}
              isCurrenciesLoading={isCurrenciesLoading}
              isDashboardLoading={isDashboardLoading}
              templates={templates}
              t={t}
            />
          </Grid>
        </Grid>
      </Stack>
    </DefaultLayout>
  );
}
