import { useState } from "react";
import { Alert, Grid, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Banknote, ChevronDown, Landmark, Pencil, Repeat, Trash2, Users } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
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

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

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

function getBankMovementIcon(transactionType: number | null) {
  if (transactionType === 1) {
    return ArrowDownToLine;
  }
  if (transactionType === 3) {
    return ArrowUpFromLine;
  }
  return null;
}

export function TransactionsPage() {
  const [isCashFlowDrawerOpen, setIsCashFlowDrawerOpen] = useState(false);
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isTransferDrawerOpen, setIsTransferDrawerOpen] = useState(false);
  const [isExchangeDrawerOpen, setIsExchangeDrawerOpen] = useState(false);
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
    exchangeRate: number;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
    isActive: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useSettings();
  const queryClient = useQueryClient();

  const banks = useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const currencies = useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const counterparties = useCounterpartiesQuery({ isActive: true, fullName: "", email: "", phoneNumber: "" }).data ?? [];
  const transactionsQuery = useTransactionsQuery();
  const dashboardQuery = useTransactionDashboardQuery();

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

  const handleEdit = async (
    type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange",
    id: string,
    transferId?: string | null,
    bankAccountId?: string | null,
    exchangeId?: string | null
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
        const bankAccount = await getBankAccountFormById(bankAccountId ?? id);
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

      const detail = await getCurrencyExchangeById(exchangeId ?? id);
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

  return (
    <DefaultLayout title={t("transactions.title")} subtitle={t("transactions.subtitle")}>
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} sx={layoutStyles.responsiveActionGroup} />
          <ActionButton
            endIcon={<ChevronDown size={16} />}
            onClick={event => setCreateMenuAnchor(event.currentTarget)}
            sx={layoutStyles.responsiveActionButton}
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

        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <PageTitleText variant="h6">{t("transactions.recentTransactions")}</PageTitleText>
              <Stack spacing={1.25} sx={{ mt: 1 }}>
                {(transactionsQuery.data ?? []).slice(0, 20).map(item => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderColor: item.type === "BankAccount" && (item.bankAccountTransactionType === 1 || item.bankAccountTransactionType === 3)
                        ? "success.main"
                        : undefined
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Stack spacing={0.25}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BodyText sx={{ fontWeight: 700 }}>{item.transactionDate}</BodyText>
                          {(() => {
                            const { className, icon: Icon } = getTransactionTypeUi(item.type);
                            return (
                              <span className={`tx-type-icon ${className}`} title={item.type}>
                                <Icon size={16} />
                              </span>
                            );
                          })()}
                          {item.type === "BankAccount" && getBankMovementIcon(item.bankAccountTransactionType) != null ? (() => {
                            const MovementIcon = getBankMovementIcon(item.bankAccountTransactionType)!;
                            return (
                              <span className="tx-type-icon tx-type-bankaccount" title={item.bankAccountTransactionType === 1 ? "InitialDeposit" : "PrincipalReturn"}>
                                <MovementIcon size={16} />
                              </span>
                            );
                          })() : null}
                        </Stack>
                        <BodyText sx={{ color: "text.secondary", fontSize: "0.9rem", fontWeight: 400, opacity: 0.8 }}>{item.description ?? "-"}</BodyText>
                      </Stack>

                      <Stack spacing={0.5} alignItems="flex-end">
                        <BodyText sx={{ color: item.type === "BankAccount" && (item.bankAccountTransactionType === 1 || item.bankAccountTransactionType === 3) ? "success.main" : item.direction === 1 ? "primary.main" : "error.main", fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{amountFormatter.format(item.amount)}</BodyText>
                        <BodyText sx={{ fontWeight: 700 }}>{item.currencyCode}</BodyText>
                        <Stack direction="row" spacing={1}>
                          <ActionButton
                            aria-label={t("transactions.edit")}
                            noWrap={false}
                            onClick={() => { void handleEdit(item.type, item.id, item.transferId, item.bankAccountId, item.exchangeId); }}
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
                            onClick={() => submit(() => deleteTransactionByType(item.type, item.id, item.exchangeId))}
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
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <PageTitleText variant="h6">{t("transactions.dashboardSummary")}</PageTitleText>
              <Stack spacing={2} sx={{ mt: 0.5 }}>
                <Stack spacing={0.5}>
                  <BodyText sx={{ fontWeight: 700 }}>{t("transactions.totalByCurrency")}</BodyText>
                  {(dashboardQuery.data?.currencyBalances ?? []).map(item => <BodyText key={item.currencyCode}>{`${item.currencyCode}: ${item.total}`}</BodyText>)}
                </Stack>
                <Stack spacing={0.5}>
                  <BodyText sx={{ fontWeight: 700 }}>{t("transactions.totalByBank")}</BodyText>
                  {(dashboardQuery.data?.activeBankBalances ?? []).map(item => <BodyText key={`${item.bankName}-${item.currencyCode}`}>{`${item.bankName} (${item.currencyCode}): ${item.totalDeposited}`}</BodyText>)}
                </Stack>
                <Stack spacing={0.5}>
                  <BodyText sx={{ fontWeight: 700 }}>{t("transactions.incomeOutcome")}</BodyText>
                  {(dashboardQuery.data?.incomeOutcomes ?? []).slice(0, 8).map(item => <BodyText key={`${item.year}-${item.month}-${item.currencyCode}`}>{`${item.year}-${String(item.month).padStart(2, "0")} ${item.currencyCode}: +${item.income} / -${item.outcome}`}</BodyText>)}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </DefaultLayout>
  );
}
