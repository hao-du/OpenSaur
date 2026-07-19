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
