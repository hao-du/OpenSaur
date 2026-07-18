import { FormControl, Select, MenuItem, Stack } from "@mui/material";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { IncomeOutcomeChart } from "../components/IncomeOutcomeChart/IncomeOutcomeChart";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useReportsPageLogic } from "../hooks/useReportsPageLogic";

export function ReportsPage() {
  const { t } = useSettings();
  const {
    defaultCurrencyCode,
    markerTagOptions,
    selectedMarkerTag,
    selectedReportType,
    selectedYear,
    setSelectedMarkerTag,
    setSelectedReportType,
    setSelectedYear,
  } = useReportsPageLogic();

  return (
    <DefaultLayout
      title={t("nav.reports")}
      headerActions={
        <FormControl size="small" sx={{ minWidth: 220, bgcolor: "background.paper" }}>
          <Select
            value={selectedReportType}
            onChange={(event) => {
              setSelectedReportType(event.target.value as typeof selectedReportType);
            }}
          >
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
      </Stack>
    </DefaultLayout>
  );
}

export default ReportsPage;
