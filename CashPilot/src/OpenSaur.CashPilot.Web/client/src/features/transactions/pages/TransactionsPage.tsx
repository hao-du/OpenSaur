import { useEffect, useMemo, useState } from "react";
import { Alert, Chip, CircularProgress, Grid, Menu, MenuItem, Pagination, Paper, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, ChevronDown, Landmark, Pencil, Repeat, Trash2, Users } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { BodyText } from "../../../components/atoms/BodyText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import {
  saveBankAccountForm,
  saveTransferForm,
  createCashFlow,
  createCurrencyExchange,
  deleteTransactionByType,
  getBankAccountFormById,
  getCashFlowById,
  getCurrencyExchangeById,
  getTransferFormById,
  updateCashFlow,
  updateCurrencyExchange
} from "../api/transactionsApi";
import type { SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useTransactionDashboardQuery } from "../hooks/useTransactionDashboardQuery";
import { CashFlowFormDrawer } from "../components/CashFlowFormDrawer";
import { BankAccountFormDrawer } from "../components/BankAccountFormDrawer";
import { TransferFormDrawer } from "../components/TransferFormDrawer";
import { ExchangeFormDrawer } from "../components/ExchangeFormDrawer";
import { TotalAmountByCurrencyCard } from "../../dashboard/components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../../dashboard/components/TotalActiveBankAccountCard";
import { IncomeOutcomeCard } from "../../dashboard/components/IncomeOutcomeCard";
import { DashboardCardSkeleton } from "../../dashboard/components/DashboardCardSkeleton";
import { TransactionsFilterDrawer, type TransactionFilterValues } from "../components/TransactionsFilterDrawer";

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const ITEMS_PER_PAGE = 30;

function getTransactionTypeUi(type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange") {
  if (type === "CashFlow") {
    return { className: "tx-type-cashflow", icon: Banknote };
  }
  if (type === "BankAccount") {
    return { className: "tx-type-bankaccount", icon: Landmark };
  }
  if (type === "Transfer") {
    return { className: "tx-type-transfer", icon: Users };
  }
  return { className: "tx-type-exchange", icon: Repeat };
}

function getTransactionTypeTagSx(type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange") {
  if (type === "CashFlow") {
    return { color: "#1565c0", borderColor: "#bbdefb", backgroundColor: "#e3f2fd" };
  }
  if (type === "BankAccount") {
    return { color: "#2e7d32", borderColor: "#c8e6c9", backgroundColor: "#e8f5e9" };
  }
  if (type === "Transfer") {
    return { color: "#6a1b9a", borderColor: "#e1bee7", backgroundColor: "#f3e5f5" };
  }
  return { color: "#ef6c00", borderColor: "#ffe0b2", backgroundColor: "#fff3e0" };
}

export function TransactionsPage() {
  const [isCashFlowDrawerOpen, setIsCashFlowDrawerOpen] = useState(false);
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isExchangeDrawerOpen, setIsExchangeDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const [editingCashFlow, setEditingCashFlow] = useState<{
    id: string;
    amount: number;
    currencyId: string;
    description?: string | null;
    direction: number;
    transactionDate: string;
    isActive: boolean;
  } | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<SaveBankAccountFormRequestDto | null>(null);
  const [editingTransferMovement, setEditingTransferMovement] = useState<{
    id: string;
    counterpartyId: string;
    transferType: number;
    status: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
    isActive: boolean;
    details: Array<{
      id: string;
      currencyId: string;
      amount: number;
      direction: number;
      transactionDate: string;
      description?: string | null;
      isActive: boolean;
    }>;
  } | null>(null);
  const [editingExchange, setEditingExchange] = useState<{
    id: string;
    exchangeRate: number | null;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
    isActive: boolean;
  } | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<{
    id: string;
    type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange";
    description: string | null;
  } | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const { formatDate, t } = useSettings();
  const queryClient = useQueryClient();
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const [filters, setFilters] = useState<TransactionFilterValues>({
    description: "",
    fromDate: startOfMonth,
    rangePreset: "Month",
    toDate: endOfMonth,
    types: ["CashFlow", "BankAccount", "Transfer", "Exchange"]
  });

  const banks = useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const currencies = useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const counterparties = useCounterpartiesQuery({ isActive: true, fullName: "", email: "", phoneNumber: "" }).data ?? [];
  const transactionsQuery = useTransactionsQuery();
  const dashboardQuery = useTransactionDashboardQuery();
  const defaultCurrencyCode = currencies.find(x => x.isDefault)?.shortName;
  const incomeOutcomeTitle = defaultCurrencyCode == null
    ? t("transactions.incomeOutcome")
    : `${t("transactions.incomeOutcome")} (${defaultCurrencyCode})`;
  const incomeOutcomeItems = defaultCurrencyCode == null
    ? (dashboardQuery.data?.incomeOutcomes ?? [])
    : (dashboardQuery.data?.incomeOutcomes ?? []).filter(x => x.currencyCode === defaultCurrencyCode);
  const isTransactionsLoading = transactionsQuery.isLoading || transactionsQuery.isFetching || !transactionsQuery.data;
  const isDashboardLoading = dashboardQuery.isLoading || dashboardQuery.isFetching || !dashboardQuery.data;
  const isCurrenciesLoading = currencies.length === 0 && (isDashboardLoading || isTransactionsLoading);

  const filteredTransactions = useMemo(() => {
    const normalizedDescription = filters.description.trim().toLowerCase();
    return (transactionsQuery.data ?? []).filter(item => {
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
  }, [transactionsQuery.data, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const pagedTransactions = useMemo(
    () => filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filteredTransactions, page]
  );

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["transaction-dashboard"] });
  };

  const submit = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
      await refresh();
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
      await submit(() => deleteTransactionByType(deletingTransaction.type, deletingTransaction.id));
      setDeletingTransaction(null);
    } finally {
      setIsDeleteConfirming(false);
    }
  };

  const handleEdit = async (
    type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange",
    id: string,
    transferId?: string | null
  ) => {
    try {
      setError(null);
      if (type === "CashFlow") {
        const detail = await getCashFlowById(id);
        setEditingCashFlow(detail);
        setIsCashFlowDrawerOpen(true);
        return;
      }

      if (type === "BankAccount") {
        const bankAccount = await getBankAccountFormById(id);
        setEditingBankAccount(bankAccount);
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
          details: transferForm.details.map(x => ({
            amount: x.amount,
            currencyId: x.currencyId,
            description: x.description,
            direction: x.direction,
            id: x.id,
            isActive: x.isActive,
            transactionDate: x.transactionDate
          })),
          dueDate: transferForm.dueDate,
          id: transferForm.id,
          isActive: transferForm.isActive,
          status: transferForm.status,
          transactionDate: transferForm.transactionDate,
          transferType: transferForm.transferType
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
        outCurrencyId: detail.outLeg.currencyId
      });
      setIsExchangeDrawerOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transactions.errorSave"));
    }
  };

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton onClick={() => setIsFilterDrawerOpen(true)} variant="outlined">
        {t("transactions.filter")}
      </ActionButton>
      <ActionButton
        endIcon={<ChevronDown size={16} />}
        onClick={event => setCreateMenuAnchor(event.currentTarget)}
        variant="contained"
      >
        {t("transactions.create")}
      </ActionButton>
      <Menu
        anchorEl={createMenuAnchor}
        onClose={() => setCreateMenuAnchor(null)}
        open={createMenuAnchor != null}
      >
        <MenuItem onClick={() => { setCreateMenuAnchor(null); setIsCashFlowDrawerOpen(true); }}>{t("transactions.cashFlow")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); setEditingBankAccount(null); setIsBankAccountDrawerOpen(true); }}>{t("transactions.bankAccount")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); setIsTransferDrawerOpen(true); }}>{t("transactions.transfer")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); setIsExchangeDrawerOpen(true); }}>{t("transactions.exchange")}</MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("transactions.title")}>
      <Stack spacing={3}>
        {error != null ? <Alert severity="error">{error}</Alert> : null}

        <CashFlowFormDrawer
          currencies={currencies}
          editingCashFlow={editingCashFlow}
          isOpen={isCashFlowDrawerOpen}
          onClose={() => { setIsCashFlowDrawerOpen(false); setEditingCashFlow(null); }}
          onSubmit={payload => submit(() => createCashFlow(payload))}
          onUpdate={(id, payload) => submit(() => updateCashFlow(id, payload))}
        />

        <BankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingBankAccount={editingBankAccount}
          isOpen={isBankAccountDrawerOpen}
          onClose={() => { setIsBankAccountDrawerOpen(false); setEditingBankAccount(null); }}
          onSave={payload => submit(() => saveBankAccountForm(payload))}
        />

        <TransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingMovement={editingTransferMovement}
          isOpen={isTransferDrawerOpen}
          onClose={() => { setIsTransferDrawerOpen(false); setEditingTransferMovement(null); }}
          onSave={payload => submit(() => saveTransferForm(payload))}
        />

        <ExchangeFormDrawer
          currencies={currencies}
          editingExchange={editingExchange}
          isOpen={isExchangeDrawerOpen}
          onClose={() => { setIsExchangeDrawerOpen(false); setEditingExchange(null); }}
          onSubmit={payload => submit(() => createCurrencyExchange(payload))}
          onUpdate={(id, payload) => submit(() => updateCurrencyExchange(id, payload))}
        />
        <TransactionsFilterDrawer
          initialValues={filters}
          isOpen={isFilterDrawerOpen}
          onApply={values => {
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
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1.25}>
                {isTransactionsLoading ? (
                  <Paper elevation={0} sx={layoutStyles.loadingPanel}>
                    <Stack alignItems="center" spacing={2}>
                      <CircularProgress size={28} />
                      <BodyText>{t("transactions.loading")}</BodyText>
                    </Stack>
                  </Paper>
                ) : pagedTransactions.length === 0 ? (
                  <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
                    <Stack spacing={1}>
                      <BodyText sx={{ fontWeight: 700 }}>{t("transactions.emptyTitle")}</BodyText>
                      <BodyText sx={{ color: "text.secondary" }}>
                        {t("transactions.emptySubtitle")}
                      </BodyText>
                    </Stack>
                  </Paper>
                ) : (
                  pagedTransactions.map(item => {
                    const bankMovementTypeLabel = item.bankAccountTransactionType === 1
                      ? t("transactions.initialDeposit")
                      : item.bankAccountTransactionType === 2
                        ? t("transactions.interestPayment")
                        : item.bankAccountTransactionType === 3
                          ? t("transactions.principalReturn")
                          : null;
                    const bankStatusLabel = item.bankAccountStatus === 1
                      ? t("transactions.statusType.active")
                      : item.bankAccountStatus === 2
                        ? t("transactions.statusType.matured")
                        : item.bankAccountStatus === 3
                          ? t("transactions.statusType.closedEarly")
                          : null;
                    const transferStatusLabel = item.transferStatus === 1
                      ? t("transactions.statusType.active")
                      : item.transferStatus === 2
                        ? t("transactions.statusType.completed")
                        : item.transferStatus === 3
                          ? t("transactions.statusType.cancelled")
                          : null;
                    const transferTypeLabel = item.transferType === 1
                      ? t("transactions.transferType.lend")
                      : item.transferType === 2
                        ? t("transactions.transferType.borrow")
                        : item.transferType === 3
                          ? t("transactions.transferType.give")
                          : item.transferType === 4
                            ? t("transactions.transferType.receive")
                            : null;
                    const tagSx = getTransactionTypeTagSx(item.type);

                    return (
                    <Paper
                      key={`${item.type}-${item.id}-${item.transactionDate}-${item.amount}-${item.direction}`}
                      variant="outlined"
                      sx={{
                        p: 1.1,
                        borderColor: item.type === "BankAccount" && (item.bankAccountTransactionType === 1 || item.bankAccountTransactionType === 3)
                          ? "success.main"
                          : undefined
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="stretch" spacing={2}>
                        <Stack spacing={0.25} sx={{ flex: 1, minHeight: 96 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <BodyText sx={{ fontWeight: 700 }}>{formatDate(item.transactionDate)}</BodyText>
                            {(() => {
                              const { className, icon: Icon } = getTransactionTypeUi(item.type);
                              return (
                                <span className={`tx-type-icon ${className}`} title={item.type}>
                                  <Icon size={16} />
                                </span>
                              );
                            })()}
                          </Stack>
                          <BodyText sx={{ color: "text.secondary", fontSize: "0.9rem", fontWeight: 400, opacity: 0.8 }}>{item.description ?? "-"}</BodyText>
                          {item.type === "BankAccount" ? (
                            <Stack direction="row" spacing={0.75} sx={{ mt: "auto", pt: 0.75, flexWrap: "wrap" }}>
                              {item.bankName ? <Chip size="small" label={item.bankName} variant="outlined" sx={tagSx} /> : null}
                              {bankStatusLabel ? <Chip size="small" label={bankStatusLabel} variant="outlined" sx={tagSx} /> : null}
                              {bankMovementTypeLabel ? <Chip size="small" label={bankMovementTypeLabel} variant="outlined" sx={tagSx} /> : null}
                            </Stack>
                          ) : null}
                          {item.type === "Transfer" ? (
                            <Stack direction="row" spacing={0.75} sx={{ mt: "auto", pt: 0.75, flexWrap: "wrap" }}>
                              {item.counterpartyName ? <Chip size="small" label={item.counterpartyName} variant="outlined" sx={tagSx} /> : null}
                              {transferStatusLabel ? <Chip size="small" label={transferStatusLabel} variant="outlined" sx={tagSx} /> : null}
                              {transferTypeLabel ? <Chip size="small" label={transferTypeLabel} variant="outlined" sx={tagSx} /> : null}
                            </Stack>
                          ) : null}
                        </Stack>

                        <Stack spacing={0.5} alignItems="flex-end">
                          <BodyText sx={{ color: item.type === "BankAccount" && (item.bankAccountTransactionType === 1 || item.bankAccountTransactionType === 3) ? "success.main" : item.direction === 1 ? "primary.main" : "error.main", fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{amountFormatter.format(item.amount)}</BodyText>
                          <BodyText sx={{ fontWeight: 700 }}>{item.currencyCode}</BodyText>
                          <Stack direction="row" spacing={1}>
                            <ActionButton
                              aria-label={t("transactions.edit")}
                              noWrap={false}
                              onClick={() => { void handleEdit(item.type, item.id, item.transferId); }}
                              size="small"
                              sx={{ borderRadius: "999px", minWidth: 34, p: 0.5 }}
                              variant="outlined"
                            >
                              <Pencil size={16} />
                            </ActionButton>
                            <ActionButton
                              aria-label={t("transactions.delete")}
                              color="error"
                              noWrap={false}
                              onClick={() => setDeletingTransaction({
                                description: item.description,
                                id: item.id,
                                type: item.type
                              })}
                              size="small"
                              sx={{ borderRadius: "999px", minWidth: 34, p: 0.5 }}
                              variant="outlined"
                            >
                              <Trash2 size={16} />
                            </ActionButton>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Paper>
                    );
                  })
                )}
                {!isTransactionsLoading ? (
                  <Stack alignItems="center" sx={{ pt: 0.5 }}>
                    <Pagination
                      count={pageCount}
                      onChange={(_, value) => setPage(value)}
                      page={page}
                      shape="rounded"
                      size="small"
                    />
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={2}>
                {isDashboardLoading ? (
                  <>
                    <DashboardCardSkeleton rows={4} />
                    <DashboardCardSkeleton rows={3} />
                    <DashboardCardSkeleton rows={4} />
                  </>
                ) : (
                  <>
                  <TotalAmountByCurrencyCard
                    items={dashboardQuery.data?.currencyBalances ?? []}
                    title={t("transactions.totalByCurrency")}
                  />
                  <TotalActiveBankAccountCard
                    items={dashboardQuery.data?.activeBankBalances ?? []}
                    title={t("transactions.totalByBank")}
                  />
                  <IncomeOutcomeCard
                    items={isCurrenciesLoading ? [] : incomeOutcomeItems}
                    title={incomeOutcomeTitle}
                  />
                  </>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </DefaultLayout>
  );
}
