import { useMemo } from "react";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useIncomeOutcomeReportQuery } from "../../hooks/useIncomeOutcomeReportQuery";

type MonthlyReportPoint = {
  label: string;
  income: number;
  outcome: number;
  order: number;
};

function getIntlLocale(locale: string) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

function formatMonthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDayMonthLabel(value: string, locale: string) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function useIncomeOutcomeChartLogic(markerTag: string, year: number) {
  const { locale, t } = useSettings();
  const reportQuery = useIncomeOutcomeReportQuery(year, markerTag || undefined);

  const monthlyPoints = useMemo<MonthlyReportPoint[]>(() => {
    const items = reportQuery.data?.items ?? [];
    const isTaggedView = markerTag.trim().length > 0;
    const pointsMap = new Map<string, MonthlyReportPoint>();

    for (const item of items) {
      const startDate = new Date(`${item.startDate}T00:00:00Z`);
      let label = formatMonthLabel(year, item.month, locale);

      if (isTaggedView) {
        label = startDate.getUTCFullYear() < year
          ? `${t("reports.pastTo")} ${formatDayMonthLabel(item.endDate, locale)}`
          : `${formatDayMonthLabel(item.startDate, locale)} ${t("reports.to")} ${formatDayMonthLabel(item.endDate, locale)}`;
      }

      const order = isTaggedView ? startDate.getTime() : item.month;
      const key = isTaggedView ? `${item.startDate}-${item.endDate}-${item.currencyCode}` : `${item.month}-${item.currencyCode}`;
      const existing = pointsMap.get(key);

      if (existing) {
        existing.income += item.income;
        existing.outcome += item.outcome;
        continue;
      }

      pointsMap.set(key, { label, income: item.income, outcome: item.outcome, order });
    }

    return Array.from(pointsMap.values()).sort((a, b) => a.order - b.order);
  }, [locale, markerTag, reportQuery.data, t, year]);

  const isLoading = reportQuery.isLoading || reportQuery.isFetching;

  return { monthlyPoints, isLoading };
}
