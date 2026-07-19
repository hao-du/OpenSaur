import { BarChart } from "@mui/x-charts/BarChart";
import { Box, CircularProgress, FormControl, IconButton, MenuItem, Paper, Select, Stack, useTheme } from "@mui/material";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useIncomeOutcomeChartLogic } from "./useIncomeOutcomeChartLogic";
import { LabelText } from "../../../../components/atoms/LabelText";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { SelectChangeEvent } from "@mui/material";

interface IncomeOutcomeChartProps {
  defaultCurrencyCode: string;
  markerTag: string;
  selectedYear: number;
  markerTagOptions: string[];
  onMarkerTagChange: (value: string) => void;
  onYearChange: (value: number) => void;
}

export function IncomeOutcomeChart({
  defaultCurrencyCode,
  markerTag,
  selectedYear,
  markerTagOptions,
  onMarkerTagChange,
  onYearChange,
}: IncomeOutcomeChartProps) {
  const { formatAmount, t } = useSettings();
  const theme = useTheme();
  const { monthlyPoints, isLoading } = useIncomeOutcomeChartLogic(markerTag, selectedYear);

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(33,33,33,0.10)", p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <BarChart3 size={18} />
            <LabelText sx={{ fontWeight: 700 }}>
              {t("transactions.incomeOutcome")}{defaultCurrencyCode.length > 0 ? ` (${defaultCurrencyCode})` : ""}
            </LabelText>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <IconButton aria-label={t("reports.previousYear")} onClick={() => onYearChange(selectedYear - 1)} size="small">
                <ChevronLeft size={18} />
              </IconButton>
              <LabelText sx={{ minWidth: 72, textAlign: "center", fontWeight: 700 }}>
                {selectedYear}
              </LabelText>
              <IconButton aria-label={t("reports.nextYear")} onClick={() => onYearChange(selectedYear + 1)} size="small">
                <ChevronRight size={18} />
              </IconButton>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                displayEmpty
                value={markerTag}
                onChange={(event: SelectChangeEvent) => {
                  onMarkerTagChange(event.target.value);
                }}
              >
                <MenuItem value="">{t("reports.monthly")}</MenuItem>
                {markerTagOptions.map((tagName) => (
                  <MenuItem key={tagName} value={tagName}>
                    {tagName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <BarChart
                height={420}
                series={[
                  {
                    color: theme.palette.success.main,
                    data: monthlyPoints.map((item) => item.income),
                    label: t("transactions.directionIn"),
                  },
                  {
                    color: theme.palette.error.main,
                    data: monthlyPoints.map((item) => item.outcome),
                    label: t("transactions.directionOut"),
                  },
                ]}
                xAxis={[
                  {
                    data: monthlyPoints.map((item) => item.label),
                    scaleType: "band",
                  },
                ]}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <LabelText sx={{ fontWeight: 700, color: "success.main" }}>
                {`${t("transactions.directionIn")}: ${formatAmount(monthlyPoints.reduce((total, item) => total + item.income, 0))}`}
              </LabelText>
              <LabelText sx={{ fontWeight: 700, color: "error.main" }}>
                {`${t("transactions.directionOut")}: ${formatAmount(monthlyPoints.reduce((total, item) => total + item.outcome, 0))}`}
              </LabelText>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
