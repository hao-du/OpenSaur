import { FormControl, Select, MenuItem, Stack } from "@mui/material";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { IncomeOutcomeChart } from "../components/IncomeOutcomeChart/IncomeOutcomeChart";
import { DateRangeIncomeOutcomeChart } from "../components/DateRangeIncomeOutcomeChart/DateRangeIncomeOutcomeChart";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useReportsPageLogic } from "../hooks/useReportsPageLogic";

export function ReportsPage() {
  const { t } = useSettings();
  const {
    defaultCurrencyCode,
    fromDate,
    markerTagOptions,
    selectedMarkerTag,
    selectedReportType,
    selectedYear,
    setFromDate,
    setSelectedMarkerTag,
    setSelectedReportType,
    setSelectedYear,
    setToDate,
    toDate,
  } = useReportsPageLogic();

  return (
    <DefaultLayout
      title={t("nav.reports")}
      headerActions={
        <FormControl size="small" sx={{ minWidth: 260, bgcolor: "background.paper" }}>
          <Select
            value={selectedReportType}
            onChange={(event) => {
              setSelectedReportType(event.target.value as typeof selectedReportType);
            }}
          >
            <MenuItem value="date-range-income-outcome">{t("reports.dateRangeIncomeOutcome")}</MenuItem>
            <MenuItem value="marker-monthly-income-outcome">{t("transactions.incomeOutcome")}</MenuItem>
          </Select>
        </FormControl>
      }
    >
      <Stack spacing={3}>
        {selectedReportType === "marker-monthly-income-outcome" && (
          <IncomeOutcomeChart
            defaultCurrencyCode={defaultCurrencyCode}
            markerTag={selectedMarkerTag}
            selectedYear={selectedYear}
            markerTagOptions={markerTagOptions}
            onMarkerTagChange={setSelectedMarkerTag}
            onYearChange={setSelectedYear}
          />
        )}
        {selectedReportType === "date-range-income-outcome" && (
          <DateRangeIncomeOutcomeChart
            defaultCurrencyCode={defaultCurrencyCode}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        )}
      </Stack>
    </DefaultLayout>
  );
}

export default ReportsPage;
