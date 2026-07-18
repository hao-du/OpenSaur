import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { Grid, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMarkerTagsQuery } from "../../transactions/hooks/dashboard/useMarkerTagsQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { TemplatePopulateActionCard } from "../components/TemplatePopulateActionCard";
import { DashboardSyncCard } from "../components/DashboardSyncCard";
import { TotalAmountByCurrencyCard } from "../components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../components/TotalActiveBankAccountCard";
import { DailyInOutCalendarCard } from "../components/DailyInOutCalendarCard/DailyInOutCalendarCard";
import { MarkerPeriodsIncomeOutcomeCard } from "../components/MarkerPeriodsIncomeOutcomeCard/MarkerPeriodsIncomeOutcomeCard";

export function DashboardPage() {
  const { t } = useSettings();
  const markerTagsQuery = useMarkerTagsQuery();
  const defaultMakerTag = markerTagsQuery.data?.find(tag => tag.isDefaultMaker);
  const currencies = useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const banks = useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const counterparties = useCounterpartiesQuery({ email: "", fullName: "", isActive: true, phoneNumber: "" }).data ?? [];
  const defaultCurrencyCode = currencies.find(x => x.isDefault)?.shortName;

  return (
    <DefaultLayout title={t("dashboard.title")}>
      <Stack spacing={3}>
        <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
          <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
            <Grid size={{ lg: 6, xs: 12 }}>
              <TemplatePopulateActionCard
                banks={banks}
                counterparties={counterparties}
                currencies={currencies}
              />
            </Grid>
            <Grid size={{ lg: 6, xs: 12 }}>
              <DashboardSyncCard />
            </Grid>
            <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
              <TotalAmountByCurrencyCard
                defaultCurrencyCode={defaultCurrencyCode}
                title={t("transactions.totalByCurrency")}
              />
            </Grid>
            <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
              <TotalActiveBankAccountCard title={t("transactions.totalByBank")} />
            </Grid>
            <Grid size={{ lg: 4, sm: 6, xs: 12 }}>
              <MarkerPeriodsIncomeOutcomeCard
                currencyCode={defaultCurrencyCode}
                defaultMakerTagName={defaultMakerTag?.name.trim()}
                title={t("transactions.incomeOutcome")}
              />
            </Grid>
          </Grid>
        </Paper>
        <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
          <DailyInOutCalendarCard
            defaultCurrencyCode={defaultCurrencyCode}
            defaultMakerTagName={defaultMakerTag?.name.trim()}
            markerOptions={markerTagsQuery.data ?? []}
            title={t("dashboard.dailyInOutCalendar")}
          />
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}

