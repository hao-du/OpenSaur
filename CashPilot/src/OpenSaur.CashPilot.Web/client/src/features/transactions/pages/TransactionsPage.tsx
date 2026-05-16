import { useState } from "react";
import { Alert, Button, Grid, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
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

  const handleEdit = async (type: "CashFlow" | "BankAccount" | "Transfer" | "Exchange", id: string, transferId?: string | null, bankAccountId?: string | null) => {
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

        <Paper sx={{ p: 2 }}>
          <PageTitleText variant="h6">{t("transactions.dashboardSummary")}</PageTitleText>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <BodyText sx={{ fontWeight: 600 }}>{t("transactions.totalByCurrency")}</BodyText>
              {(dashboardQuery.data?.currencyBalances ?? []).map(item => <BodyText key={item.currencyCode}>{`${item.currencyCode}: ${item.total}`}</BodyText>)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <BodyText sx={{ fontWeight: 600 }}>{t("transactions.totalByBank")}</BodyText>
              {(dashboardQuery.data?.activeBankBalances ?? []).map(item => <BodyText key={`${item.bankName}-${item.currencyCode}`}>{`${item.bankName} (${item.currencyCode}): ${item.totalDeposited}`}</BodyText>)}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <BodyText sx={{ fontWeight: 600 }}>{t("transactions.incomeOutcome")}</BodyText>
              {(dashboardQuery.data?.incomeOutcomes ?? []).slice(0, 8).map(item => <BodyText key={`${item.year}-${item.month}-${item.currencyCode}`}>{`${item.year}-${String(item.month).padStart(2, "0")} ${item.currencyCode}: +${item.income} / -${item.outcome}`}</BodyText>)}
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <PageTitleText variant="h6">{t("transactions.recentTransactions")}</PageTitleText>
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {(transactionsQuery.data ?? []).slice(0, 20).map(item => (
              <Stack key={item.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <BodyText>{`${item.transactionDate} | ${item.type} | ${item.currencyCode} ${item.amount} | ${item.direction === 1 ? "In" : "Out"} | ${item.description ?? ""}`}</BodyText>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => { void handleEdit(item.type, item.id, item.transferId, item.bankAccountId); }}>{t("transactions.edit")}</Button>
                  <Button size="small" color="error" onClick={() => submit(() => deleteTransactionByType(item.type, item.id))}>{t("transactions.delete")}</Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}
