import { BarChart } from "@mui/x-charts/BarChart";
import { Box, CircularProgress, Paper, Stack, useTheme } from "@mui/material";
import { BarChart3 } from "lucide-react";
import { useDateRangeIncomeOutcomeChartLogic } from "./useDateRangeIncomeOutcomeChartLogic";
import { LabelText } from "../../../../components/atoms/LabelText";
import { DatePicker } from "../../../../components/atoms/DatePicker";
import { useSettings } from "../../../settings/provider/SettingProvider";

interface DateRangeIncomeOutcomeChartProps {
  defaultCurrencyCode: string;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}

export function DateRangeIncomeOutcomeChart({
  defaultCurrencyCode,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangeIncomeOutcomeChartProps) {
  const { formatAmount, t } = useSettings();
  const theme = useTheme();

  // From Date can be at month resolution "YYYY-MM" or full "YYYY-MM-DD", normalize to full month boundaries for backend query
  const normalizedFromDate = fromDate.length === 7 ? `${fromDate}-01` : fromDate;
  const normalizedToDate = toDate.length === 7
    ? (() => {
        const [yearStr, monthStr] = toDate.split("-");
        const y = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        const lastDay = new Date(y, m, 0).getDate();
        return `${toDate}-${String(lastDay).padStart(2, "0")}`;
      })()
    : toDate;

  const { monthlyPoints, isLoading } = useDateRangeIncomeOutcomeChartLogic(
    normalizedFromDate,
    normalizedToDate
  );

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(33,33,33,0.10)", p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <BarChart3 size={18} />
            <LabelText sx={{ fontWeight: 700 }}>
              {t("reports.dateRangeIncomeOutcome")}{defaultCurrencyCode.length > 0 ? ` (${defaultCurrencyCode})` : ""}
            </LabelText>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Box sx={{ width: 150 }}>
              <DatePicker
                label={t("reports.fromDate")}
                mode="month"
                value={fromDate}
                onChange={(val) => onFromDateChange(val)}
              />
            </Box>

            <Box sx={{ width: 150 }}>
              <DatePicker
                label={t("reports.toDate")}
                mode="month"
                value={toDate}
                onChange={(val) => onToDateChange(val)}
              />
            </Box>
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

            {(() => {
              const totalIncome = monthlyPoints.reduce((total, item) => total + item.income, 0);
              const totalOutcome = monthlyPoints.reduce((total, item) => total + item.outcome, 0);
              const netAmount = totalIncome - totalOutcome;

              return (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexWrap: "wrap" }}>
                  <LabelText sx={{ fontWeight: 700, color: "success.main" }}>
                    {`${t("transactions.directionIn")}: ${formatAmount(totalIncome)}`}
                  </LabelText>
                  <LabelText sx={{ fontWeight: 700, color: "error.main" }}>
                    {`${t("transactions.directionOut")}: ${formatAmount(totalOutcome)}`}
                  </LabelText>
                  <LabelText sx={{ fontWeight: 700, color: netAmount >= 0 ? "primary.main" : "error.main" }}>
                    {`${t("reports.netIncome")}: ${formatAmount(netAmount)}`}
                  </LabelText>
                </Stack>
              );
            })()}
          </>
        )}
      </Stack>
    </Paper>
  );
}
