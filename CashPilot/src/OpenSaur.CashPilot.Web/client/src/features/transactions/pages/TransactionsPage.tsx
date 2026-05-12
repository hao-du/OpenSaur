import { useMemo, useState } from "react";
import { Alert, Box, Button, Grid, MenuItem, Paper, Stack, Tab, Tabs, TextField } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import {
  addBankAccountTransaction,
  addTransferTransaction,
  createBankAccount,
  createCashFlow,
  createCurrencyExchange,
  createTransfer
} from "../api/transactionsApi";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useTransactionDashboardQuery } from "../hooks/useTransactionDashboardQuery";

const defaultDate = new Date().toISOString().slice(0, 10);

export function TransactionsPage() {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { t } = useSettings();
  const queryClient = useQueryClient();
  const banksQuery = useBanksQuery({ isActive: true, name: "", shortName: "" });
  const currenciesQuery = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });
  const counterpartiesQuery = useCounterpartiesQuery({ isActive: true, fullName: "", email: "", phoneNumber: "" });
  const transactionsQuery = useTransactionsQuery();
  const dashboardQuery = useTransactionDashboardQuery();

  const banks = banksQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const counterparties = counterpartiesQuery.data ?? [];

  const firstCurrencyId = useMemo(() => currencies[0]?.id ?? "", [currencies]);
  const firstBankId = useMemo(() => banks[0]?.id ?? "", [banks]);
  const firstCounterpartyId = useMemo(() => counterparties[0]?.id ?? "", [counterparties]);

  const [cashFlow, setCashFlow] = useState({ amount: "", currencyId: "", direction: "2", transactionDate: defaultDate, description: "" });
  const [bankAccount, setBankAccount] = useState({ bankId: "", currencyId: "", amount: "", interestRate: "", startDate: defaultDate, maturityDate: defaultDate, accountNumber: "", description: "" });
  const [bankMovement, setBankMovement] = useState({ bankAccountId: "", currencyId: "", amount: "", direction: "1", transactionType: "2", transactionDate: defaultDate, description: "" });
  const [transfer, setTransfer] = useState({ counterpartyId: "", currencyId: "", transferType: "1", amount: "", transactionDate: defaultDate, dueDate: "", description: "" });
  const [transferMovement, setTransferMovement] = useState({ transferId: "", currencyId: "", amount: "", direction: "1", transactionDate: defaultDate, description: "" });
  const [exchange, setExchange] = useState({ exchangeRate: "", exchangeDate: defaultDate, outCurrencyId: "", outAmount: "", inCurrencyId: "", inAmount: "", description: "" });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    await queryClient.invalidateQueries({ queryKey: ["transaction-dashboard"] });
  };

  const onError = (e: unknown) => {
    const message = e instanceof Error ? e.message : t("transactions.errorSave");
    setError(message);
  };

  return (
    <DefaultLayout title={t("transactions.title")} subtitle={t("transactions.subtitle")}>
      <Stack spacing={2}>
        {error != null ? <Alert severity="error">{error}</Alert> : null}
        <Paper sx={{ p: 2 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label={t("transactions.cashFlow")} />
            <Tab label={t("transactions.bankAccount")} />
            <Tab label={t("transactions.transfer")} />
            <Tab label={t("transactions.exchange")} />
          </Tabs>
          <Box sx={{ pt: 2 }}>
            {tab === 0 ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label={t("transactions.amount")} value={cashFlow.amount} onChange={e => setCashFlow({ ...cashFlow, amount: e.target.value })} fullWidth />
                <TextField select label={t("transactions.currency")} value={cashFlow.currencyId || firstCurrencyId} onChange={e => setCashFlow({ ...cashFlow, currencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField>
                <TextField select label={t("transactions.direction")} value={cashFlow.direction} onChange={e => setCashFlow({ ...cashFlow, direction: e.target.value })} fullWidth><MenuItem value="1">In</MenuItem><MenuItem value="2">Out</MenuItem></TextField>
                <TextField type="date" label={t("transactions.date")} value={cashFlow.transactionDate} onChange={e => setCashFlow({ ...cashFlow, transactionDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                <Button variant="contained" onClick={async () => {
                  try {
                    setError(null);
                    await createCashFlow({ amount: Number(cashFlow.amount), currencyId: cashFlow.currencyId || firstCurrencyId, description: cashFlow.description, direction: Number(cashFlow.direction), transactionDate: cashFlow.transactionDate });
                    await refresh();
                  } catch (e) { onError(e); }
                }}>{t("transactions.create")}</Button>
              </Stack>
            ) : null}

            {tab === 1 ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}><TextField select label={t("transactions.bank")} value={bankAccount.bankId || firstBankId} onChange={e => setBankAccount({ ...bankAccount, bankId: e.target.value })} fullWidth>{banks.map(b => <MenuItem key={b.id} value={b.id}>{b.shortName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField select label={t("transactions.currency")} value={bankAccount.currencyId || firstCurrencyId} onChange={e => setBankAccount({ ...bankAccount, currencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField label={t("transactions.amount")} value={bankAccount.amount} onChange={e => setBankAccount({ ...bankAccount, amount: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField label={t("transactions.interestRate")} value={bankAccount.interestRate} onChange={e => setBankAccount({ ...bankAccount, interestRate: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Button sx={{ height: "100%" }} fullWidth variant="contained" onClick={async () => {
                    try {
                      setError(null);
                      await createBankAccount({ amount: Number(bankAccount.amount), bankId: bankAccount.bankId || firstBankId, currencyId: bankAccount.currencyId || firstCurrencyId, description: bankAccount.description, interestRate: Number(bankAccount.interestRate), maturityDate: bankAccount.maturityDate, startDate: bankAccount.startDate, accountNumber: bankAccount.accountNumber });
                      await refresh();
                    } catch (e) { onError(e); }
                  }}>{t("transactions.createBankAccount")}</Button></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}><TextField label={t("transactions.bankAccountId")} value={bankMovement.bankAccountId} onChange={e => setBankMovement({ ...bankMovement, bankAccountId: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.currency")} value={bankMovement.currencyId || firstCurrencyId} onChange={e => setBankMovement({ ...bankMovement, currencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField label={t("transactions.amount")} value={bankMovement.amount} onChange={e => setBankMovement({ ...bankMovement, amount: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.movementType")} value={bankMovement.transactionType} onChange={e => setBankMovement({ ...bankMovement, transactionType: e.target.value })} fullWidth><MenuItem value="1">InitialDeposit</MenuItem><MenuItem value="2">InterestPayment</MenuItem><MenuItem value="3">PrincipalReturn</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, md: 1 }}><TextField select label={t("transactions.direction")} value={bankMovement.direction} onChange={e => setBankMovement({ ...bankMovement, direction: e.target.value })} fullWidth><MenuItem value="1">In</MenuItem><MenuItem value="2">Out</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Button sx={{ height: "100%" }} fullWidth variant="outlined" onClick={async () => {
                    try {
                      setError(null);
                      await addBankAccountTransaction({ amount: Number(bankMovement.amount), bankAccountId: bankMovement.bankAccountId, currencyId: bankMovement.currencyId || firstCurrencyId, description: bankMovement.description, direction: Number(bankMovement.direction), transactionDate: bankMovement.transactionDate, transactionType: Number(bankMovement.transactionType) });
                      await refresh();
                    } catch (e) { onError(e); }
                  }}>{t("transactions.addTransaction")}</Button></Grid>
                </Grid>
              </Stack>
            ) : null}

            {tab === 2 ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}><TextField select label={t("transactions.counterparty")} value={transfer.counterpartyId || firstCounterpartyId} onChange={e => setTransfer({ ...transfer, counterpartyId: e.target.value })} fullWidth>{counterparties.map(c => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.type")} value={transfer.transferType} onChange={e => setTransfer({ ...transfer, transferType: e.target.value })} fullWidth><MenuItem value="1">Lend</MenuItem><MenuItem value="2">Borrow</MenuItem><MenuItem value="3">Give</MenuItem><MenuItem value="4">Receive</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.currency")} value={transfer.currencyId || firstCurrencyId} onChange={e => setTransfer({ ...transfer, currencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField label={t("transactions.amount")} value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><Button sx={{ height: "100%" }} fullWidth variant="contained" onClick={async () => {
                    try {
                      setError(null);
                      await createTransfer({ amount: Number(transfer.amount), counterpartyId: transfer.counterpartyId || firstCounterpartyId, currencyId: transfer.currencyId || firstCurrencyId, description: transfer.description, dueDate: transfer.dueDate || undefined, transactionDate: transfer.transactionDate, transferType: Number(transfer.transferType) });
                      await refresh();
                    } catch (e) { onError(e); }
                  }}>{t("transactions.createTransfer")}</Button></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}><TextField label={t("transactions.transferId")} value={transferMovement.transferId} onChange={e => setTransferMovement({ ...transferMovement, transferId: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.currency")} value={transferMovement.currencyId || firstCurrencyId} onChange={e => setTransferMovement({ ...transferMovement, currencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField label={t("transactions.amount")} value={transferMovement.amount} onChange={e => setTransferMovement({ ...transferMovement, amount: e.target.value })} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><TextField select label={t("transactions.direction")} value={transferMovement.direction} onChange={e => setTransferMovement({ ...transferMovement, direction: e.target.value })} fullWidth><MenuItem value="1">In</MenuItem><MenuItem value="2">Out</MenuItem></TextField></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Button sx={{ height: "100%" }} fullWidth variant="outlined" onClick={async () => {
                    try {
                      setError(null);
                      await addTransferTransaction({ amount: Number(transferMovement.amount), currencyId: transferMovement.currencyId || firstCurrencyId, description: transferMovement.description, direction: Number(transferMovement.direction), transactionDate: transferMovement.transactionDate, transferId: transferMovement.transferId });
                      await refresh();
                    } catch (e) { onError(e); }
                  }}>{t("transactions.addTransaction")}</Button></Grid>
                </Grid>
              </Stack>
            ) : null}

            {tab === 3 ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label={t("transactions.exchangeRate")} value={exchange.exchangeRate} onChange={e => setExchange({ ...exchange, exchangeRate: e.target.value })} fullWidth />
                <TextField select label={t("transactions.outCurrency")} value={exchange.outCurrencyId || firstCurrencyId} onChange={e => setExchange({ ...exchange, outCurrencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField>
                <TextField label={t("transactions.outAmount")} value={exchange.outAmount} onChange={e => setExchange({ ...exchange, outAmount: e.target.value })} fullWidth />
                <TextField select label={t("transactions.inCurrency")} value={exchange.inCurrencyId || firstCurrencyId} onChange={e => setExchange({ ...exchange, inCurrencyId: e.target.value })} fullWidth>{currencies.map(c => <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>)}</TextField>
                <TextField label={t("transactions.inAmount")} value={exchange.inAmount} onChange={e => setExchange({ ...exchange, inAmount: e.target.value })} fullWidth />
                <Button variant="contained" onClick={async () => {
                  try {
                    setError(null);
                    await createCurrencyExchange({ exchangeDate: exchange.exchangeDate, exchangeRate: Number(exchange.exchangeRate), description: exchange.description, inLeg: { amount: Number(exchange.inAmount), currencyId: exchange.inCurrencyId || firstCurrencyId }, outLeg: { amount: Number(exchange.outAmount), currencyId: exchange.outCurrencyId || firstCurrencyId } });
                    await refresh();
                  } catch (e) { onError(e); }
                }}>{t("transactions.createExchange")}</Button>
              </Stack>
            ) : null}
          </Box>
        </Paper>

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
              <BodyText key={item.id}>{`${item.transactionDate} | ${item.type} | ${item.currencyCode} ${item.amount} | ${item.direction === 1 ? "In" : "Out"} | ${item.description ?? ""}`}</BodyText>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}
