import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Paper, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import { getMarkerCalendar } from "../../transactions/api/transactionsApi";
import { useMarkerCalendarQuery } from "../../transactions/hooks/useMarkerCalendarQuery";

type MarkerPeriodSummary = {
  startDate: string | null;
  endDate: string | null;
  income: number;
  outcome: number;
};

type Props = {
  title: string;
  currencyCode?: string;
  defaultMakerTagName: string;
};

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function buildMarkerPeriodLabel(period: MarkerPeriodSummary, monthLabel: string, pastPeriodLabel: string) {
  if (period.startDate == null) {
    return pastPeriodLabel;
  }

  if (period.endDate == null) {
    return period.startDate;
  }

  const start = parseIsoDate(period.startDate);
  const end = parseIsoDate(period.endDate);
  const startMonth = `${monthLabel} ${start.getUTCMonth() + 1}`;
  const endMonth = `${monthLabel} ${end.getUTCMonth() + 1}`;

  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return `${startMonth} ${start.getUTCFullYear()}`;
  }

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${startMonth} - ${endMonth} / ${start.getUTCFullYear()}`;
  }

  return `${startMonth} ${start.getUTCFullYear()} - ${endMonth} ${end.getUTCFullYear()}`;
}

export function IncomeOutcomeMakerPeriodsCard({ title, currencyCode, defaultMakerTagName }: Props) {
  const { formatAmount, t } = useSettings();
  const resolvedTitle = `${title} ${t("dashboard.by")} ${defaultMakerTagName}`;
  const defaultMakerCalendarQuery = useMarkerCalendarQuery(defaultMakerTagName, undefined, true);
  const defaultMakerCalendar = defaultMakerCalendarQuery.data;

  const defaultMakerPeriodIndices = useMemo(() => {
    if (defaultMakerCalendar == null) {
      return [];
    }

    const count = Math.min(3, defaultMakerCalendar.periods.length);
    return Array.from({ length: count }, (_, index) => defaultMakerCalendar.periods.length - count + index);
  }, [defaultMakerCalendar]);

  const defaultMakerPeriodQueries = useQueries({
    queries: defaultMakerPeriodIndices.map(periodIndex => ({
      enabled: defaultMakerCalendar != null,
      queryFn: () => getMarkerCalendar(defaultMakerTagName, periodIndex),
      queryKey: ["marker-calendar", defaultMakerTagName, periodIndex]
    }))
  });

  const markerPeriods = useMemo(() => {
    if (defaultMakerCalendar == null) {
      return [];
    }

    const summaries: MarkerPeriodSummary[] = [];

    defaultMakerPeriodIndices.forEach((periodIndex, index) => {
      const period = defaultMakerCalendar.periods[periodIndex];
      const periodData = defaultMakerPeriodQueries[index].data;

      if (period == null || periodData == null) {
        return;
      }

      const totals = periodData.items.reduce(
        (acc, item) => ({
          income: acc.income + item.income,
          outcome: acc.outcome + item.outcome
        }),
        { income: 0, outcome: 0 }
      );

      summaries.push({
        endDate: period.endDate,
        income: totals.income,
        outcome: totals.outcome,
        startDate: period.startDate
      });
    });

    return summaries;
  }, [defaultMakerCalendar, defaultMakerPeriodIndices, defaultMakerPeriodQueries]);

  const isLoading =
    defaultMakerCalendarQuery.isLoading ||
    defaultMakerCalendarQuery.isFetching ||
    defaultMakerPeriodQueries.some(query => query.isLoading || query.isFetching);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <PageTitleText variant="h6">{resolvedTitle}</PageTitleText>
        {currencyCode != null && currencyCode.trim().length > 0 ? (
          <BodyText>{`(${currencyCode})`}</BodyText>
        ) : null}
      </Stack>
      {isLoading ? (
        <BodyText sx={{ mt: 1 }}>{t("transactions.loading")}</BodyText>
      ) : (
        <Stack spacing={1.25} sx={{ mt: 0.75, flex: 1 }}>
          {markerPeriods.map((period, index) => (
            <Stack
              key={`${period.startDate ?? "past"}-${period.endDate ?? "current"}-${index}`}
              direction="row"
              justifyContent="space-between"
              spacing={2}
              alignItems="flex-start"
            >
              <BodyText sx={{ minWidth: 110, pt: 0.25 }}>
                {buildMarkerPeriodLabel(period, t("transactions.filter.month"), t("dashboard.pastPeriod"))}
              </BodyText>
              <Stack spacing={0.25} sx={{ minWidth: 160, fontVariantNumeric: "tabular-nums" }}>
                <BodyText sx={{ color: "success.main", textAlign: "right" }}>
                  {`+${formatAmount(period.income)}`}
                </BodyText>
                <BodyText sx={{ color: "error.main", textAlign: "right" }}>
                  {`-${formatAmount(period.outcome)}`}
                </BodyText>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
