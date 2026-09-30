import { client } from "../../../infrastructure/http/client";

export interface IncomeOutcomeReportItem {
  month: number;
  currencyCode: string;
  startDate: string;
  endDate: string | null;
  income: number;
  outcome: number;
}

export interface IncomeOutcomeReportResponse {
  year: number;
  defaultCurrencyCode: string | null;
  items: IncomeOutcomeReportItem[];
}

export async function getIncomeOutcome(year: number, tagName?: string): Promise<IncomeOutcomeReportResponse> {
  const params = new URLSearchParams();
  params.set("year", year.toString());
  if (tagName) params.set("tagName", tagName);
  return client.get<IncomeOutcomeReportResponse>(`/api/reports/income-outcome?${params}`);
}

export interface DateRangeIncomeOutcomeReportItem {
  year: number;
  month: number;
  currencyCode: string;
  startDate: string;
  endDate: string | null;
  income: number;
  outcome: number;
}

export interface DateRangeIncomeOutcomeReportResponse {
  fromDate: string;
  toDate: string;
  defaultCurrencyCode: string | null;
  items: DateRangeIncomeOutcomeReportItem[];
}

export async function getIncomeOutcomeByRange(
  fromDate: string,
  toDate: string
): Promise<DateRangeIncomeOutcomeReportResponse> {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return client.get<DateRangeIncomeOutcomeReportResponse>(`/api/reports/income-outcome-by-range?${params}`);
}

