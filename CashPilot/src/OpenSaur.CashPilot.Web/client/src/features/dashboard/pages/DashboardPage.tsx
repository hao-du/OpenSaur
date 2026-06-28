import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { Grid, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactionDashboardQuery } from "../../transactions/hooks/useTransactionDashboardQuery";
import { useDailyInOutCalendarQuery } from "../../transactions/hooks/useDailyInOutCalendarQuery";
import { useMarkerTagsQuery } from "../../transactions/hooks/useMarkerTagsQuery";
import { useMarkerCalendarQuery } from "../../transactions/hooks/useMarkerCalendarQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useTemplatesQuery } from "../../templates/hooks/useTemplatesQuery";
import { TemplatePopulateActionCard } from "../components/TemplatePopulateActionCard";
import { DashboardSyncCard } from "../components/DashboardSyncCard";
import { TotalAmountByCurrencyCard } from "../components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../components/TotalActiveBankAccountCard";
import { IncomeOutcomeCard } from "../components/IncomeOutcomeCard";
import { DashboardCardSkeleton } from "../components/DashboardCardSkeleton";
import { DailyInOutCalendarCard } from "../components/DailyInOutCalendarCard";

export function DashboardPage() {
  const { t, todayIsoDate } = useSettings();
  const navigate = useNavigate();
  const transactionDashboard = useTransactionDashboardQuery();
  const now = new Date(todayIsoDate);
  const [calendarYear, setCalendarYear] = useState(now.getUTCFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getUTCMonth() + 1);
  const [selectedMarkerTag, setSelectedMarkerTag] = useState<string>("__monthly__");
  const [selectedMarkerPeriodIndex, setSelectedMarkerPeriodIndex] = useState<number | undefined>();
  const markerTagsQuery = useMarkerTagsQuery();
  const calendarQuery = useDailyInOutCalendarQuery(calendarYear, calendarMonth);
  const isMarkerMode = selectedMarkerTag !== "__monthly__";
  const defaultMakerTag = markerTagsQuery.data?.find(tag => tag.isDefaultMaker);
  const markerCalendarQuery = useMarkerCalendarQuery(
    isMarkerMode ? selectedMarkerTag : "",
    selectedMarkerPeriodIndex,
    isMarkerMode
  );
  const currencies = useCurrenciesQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const banks = useBanksQuery({ isActive: true, name: "", shortName: "" }).data ?? [];
  const counterparties = useCounterpartiesQuery({ email: "", fullName: "", isActive: true, phoneNumber: "" }).data ?? [];
  const { data: templates = [], refetch: refetchTemplates } = useTemplatesQuery({ isActive: true, name: "", templateType: "" });
  const isLoading = transactionDashboard.isLoading || transactionDashboard.isFetching || !transactionDashboard.data;
  const isCurrenciesLoading = currencies.length === 0 && transactionDashboard.isLoading;
  const defaultCurrencyCode = currencies.find(x => x.isDefault)?.shortName;
  const incomeOutcomeTitle = defaultMakerTag != null && defaultMakerTag.name.trim().length > 0
    ? `${t("transactions.incomeOutcome")} ${t("dashboard.by")} ${defaultMakerTag.name.trim()}`
    : t("transactions.incomeOutcome");
  const incomeOutcomeItems = defaultCurrencyCode == null
    ? (transactionDashboard.data?.incomeOutcomes ?? [])
    : (transactionDashboard.data?.incomeOutcomes ?? []).filter(x => x.currencyCode === defaultCurrencyCode);
  const markerCalendar = markerCalendarQuery.data;

  return (
    <DefaultLayout title={t("dashboard.title")}>
      <Stack spacing={3}>
        <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid size={{ lg: 6, xs: 12 }}>
              <TemplatePopulateActionCard
                banks={banks}
                counterparties={counterparties}
                currencies={currencies}
                onSaved={async () => {
                  await transactionDashboard.refetch();
                  await refetchTemplates();
                }}
                templates={templates}
              />
            </Grid>
            <Grid size={{ lg: 6, xs: 12 }}>
              <DashboardSyncCard />
            </Grid>
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
              {isLoading || isCurrenciesLoading || markerTagsQuery.isLoading ? (
                <DashboardCardSkeleton rows={4} />
              ) : (
                <IncomeOutcomeCard
                  currencyCode={defaultCurrencyCode}
                  defaultMakerTagName={defaultMakerTag?.name}
                  items={incomeOutcomeItems}
                  title={incomeOutcomeTitle}
                />
              )}
            </Grid>
          </Grid>
          </Paper>
        <Paper elevation={0} sx={(theme) => ({ border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, p: 3 })}>
          {calendarQuery.isLoading || calendarQuery.isFetching ? (
            <DashboardCardSkeleton rows={15} />
          ) : (
            <DailyInOutCalendarCard
              defaultCurrencyCode={calendarQuery.data?.currencyCode ?? undefined}
              isLoading={markerTagsQuery.isLoading || calendarQuery.isLoading || calendarQuery.isFetching || (isMarkerMode && (markerCalendarQuery.isLoading || markerCalendarQuery.isFetching))}
              inLabel={t("transactions.directionIn")}
              dailyItems={calendarQuery.data?.items ?? []}
              markerTags={markerTagsQuery.data ?? []}
              markerCalendar={isMarkerMode ? markerCalendar : undefined}
              month={calendarMonth}
              monthLabel={t("transactions.filter.month")}
              monthlyLabel={t("dashboard.monthly")}
              noDefaultCurrencyLabel={t("dashboard.defaultCurrencyRequired")}
              noDataAvailableLabel={t("dashboard.noDataAvailable")}
              onDayClick={(day) => {
                navigate(`/transactions?date=${day}`);
              }}
              onMarkerTagChange={(tagName) => {
                setSelectedMarkerTag(tagName);
                setSelectedMarkerPeriodIndex(undefined);
              }}
              onNextMarkerPeriod={() => {
                if (markerCalendar == null) {
                  return;
                }

                setSelectedMarkerPeriodIndex(Math.min(
                  markerCalendar.selectedPeriodIndex + 1,
                  markerCalendar.periods.length - 1
                ));
              }}
              onPreviousMarkerPeriod={() => {
                if (markerCalendar == null) {
                  return;
                }

                setSelectedMarkerPeriodIndex(Math.max(markerCalendar.selectedPeriodIndex - 1, 0));
              }}
              onMonthChange={setCalendarMonth}
              onYearChange={setCalendarYear}
              outLabel={t("transactions.directionOut")}
              selectedMarkerTag={selectedMarkerTag}
              pastPeriodLabel={t("dashboard.pastPeriod")}
              title={t("dashboard.dailyInOutCalendar")}
              year={calendarYear}
              yearLabel={t("transactions.filter.year")}
            />
          )}
        </Paper>
      </Stack>
    </DefaultLayout>
  );
}
