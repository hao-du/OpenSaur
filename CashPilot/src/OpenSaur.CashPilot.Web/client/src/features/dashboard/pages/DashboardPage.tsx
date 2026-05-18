import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { Grid, Paper, Stack } from "@mui/material";
import { useTransactionDashboardQuery } from "../../transactions/hooks/useTransactionDashboardQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { TotalAmountByCurrencyCard } from "../../transactions/components/dashboard/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../../transactions/components/dashboard/TotalActiveBankAccountCard";
import { IncomeOutcomeCard } from "../../transactions/components/dashboard/IncomeOutcomeCard";
import { DashboardCardSkeleton } from "../../transactions/components/dashboard/DashboardCardSkeleton";

export function DashboardPage() {
  const { t } = useSettings();
  const transactionDashboard = useTransactionDashboardQuery();
  const currencies = useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const isLoading = transactionDashboard.isLoading || transactionDashboard.isFetching || !transactionDashboard.data;
  const isCurrenciesLoading = currencies.length === 0 && transactionDashboard.isLoading;
  const defaultCurrencyCode = currencies.find(x => x.isDefault)?.shortName;
  const incomeOutcomeTitle = defaultCurrencyCode == null
    ? t("transactions.incomeOutcome")
    : `${t("transactions.incomeOutcome")} (${defaultCurrencyCode})`;
  const incomeOutcomeItems = defaultCurrencyCode == null
    ? (transactionDashboard.data?.incomeOutcomes ?? [])
    : (transactionDashboard.data?.incomeOutcomes ?? []).filter(x => x.currencyCode === defaultCurrencyCode);

  return (
    <DefaultLayout
      title={t("dashboard.title")}
    >
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 3 }}>
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems="stretch">
              <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
                {isLoading ? (
                  <DashboardCardSkeleton rows={4} />
                ) : (
                  <TotalAmountByCurrencyCard
                    items={transactionDashboard.data?.currencyBalances ?? []}
                    title={t("transactions.totalByCurrency")}
                  />
                )}
              </Grid>
              <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
                {isLoading ? (
                  <DashboardCardSkeleton rows={3} />
                ) : (
                  <TotalActiveBankAccountCard
                    items={transactionDashboard.data?.activeBankBalances ?? []}
                    title={t("transactions.totalByBank")}
                  />
                )}
              </Grid>
              <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
                {isLoading || isCurrenciesLoading ? (
                  <DashboardCardSkeleton rows={4} />
                ) : (
                  <IncomeOutcomeCard
                    items={incomeOutcomeItems}
                    title={incomeOutcomeTitle}
                  />
                )}
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}
