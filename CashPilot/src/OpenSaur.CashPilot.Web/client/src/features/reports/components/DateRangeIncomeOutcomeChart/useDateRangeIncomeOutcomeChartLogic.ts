import { useMemo } from "react";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useIncomeOutcomeByRangeReportQuery } from "../../hooks/useIncomeOutcomeByRangeReportQuery";

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
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function useDateRangeIncomeOutcomeChartLogic(
  fromDate: string,
  toDate: string
) {
  const { locale } = useSettings();
  const reportQuery = useIncomeOutcomeByRangeReportQuery(fromDate, toDate);

  const monthlyPoints = useMemo<MonthlyReportPoint[]>(() => {
    const items = reportQuery.data?.items ?? [];
    const pointsMap = new Map<string, MonthlyReportPoint>();

    for (const item of items) {
      const label = formatMonthLabel(item.year, item.month, locale);
      const order = item.year * 100 + item.month;
      const key = `${item.year}-${item.month}-${item.currencyCode}`;
      const existing = pointsMap.get(key);

      if (existing) {
        existing.income += item.income;
        existing.outcome += item.outcome;
        continue;
      }

      pointsMap.set(key, { label, income: item.income, outcome: item.outcome, order });
    }

    return Array.from(pointsMap.values()).sort((a, b) => a.order - b.order);
  }, [locale, reportQuery.data]);

  const isLoading = reportQuery.isLoading || reportQuery.isFetching;

  return { monthlyPoints, isLoading };
}
