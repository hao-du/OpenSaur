import { Grid, MenuItem, Paper, Select, Stack, Tooltip } from "@mui/material";
import { useMemo } from "react";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { DailyInOutCalendarItemDto } from "../../transactions/dtos/TransactionDto";

type Props = {
  title: string;
  inLabel: string;
  outLabel: string;
  monthLabel: string;
  yearLabel: string;
  noDefaultCurrencyLabel: string;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  isLoading?: boolean;
  defaultCurrencyCode?: string;
  items: DailyInOutCalendarItemDto[];
  onDayClick?: (day: number) => void;
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const monthNames = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
];

export function DailyInOutCalendarCard({
  title,
  inLabel,
  outLabel,
  monthLabel,
  yearLabel,
  noDefaultCurrencyLabel,
  year,
  month,
  onYearChange,
  onMonthChange,
  isLoading = false,
  defaultCurrencyCode,
  items,
  onDayClick
}: Props) {
  const yearOptions = useMemo(() => {
    const years = new Set<number>([year - 1, year, year + 1]);
    return Array.from(years).sort((a, b) => b - a);
  }, [year]);

  const dailySummary = useMemo(() => {
    const result = new Map<number, { income: number; outcome: number }>();
    items.forEach(item => {
      result.set(item.day, {
        income: item.income,
        outcome: item.outcome
      });
    });
    return result;
  }, [items]);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (firstDay + 6) % 7;
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <PageTitleText variant="h6">{title}</PageTitleText>
        <Stack direction="row" spacing={1}>
          <Select size="small" value={month.toString()} onChange={e => onMonthChange(Number(e.target.value))}>
            {monthNames.map((month, index) => (
              <MenuItem key={month} value={(index + 1).toString()}>{`${monthLabel} ${month}`}</MenuItem>
            ))}
          </Select>
          <Select size="small" value={year.toString()} onChange={e => onYearChange(Number(e.target.value))}>
            {yearOptions.map(year => (
              <MenuItem key={year} value={year.toString()}>{`${yearLabel} ${year}`}</MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>

      {isLoading ? (
        <BodyText>...</BodyText>
      ) : defaultCurrencyCode == null || defaultCurrencyCode.trim().length === 0 ? (
        <BodyText>{noDefaultCurrencyLabel}</BodyText>
      ) : (
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Grid container columns={7} spacing={0.5}>
            {weekDays.map(day => (
              <Grid key={day} size={1}>
                <BodyText sx={{ fontWeight: 600, textAlign: "center" }}>{day}</BodyText>
              </Grid>
            ))}

            {Array.from({ length: totalCells }).map((_, cellIndex) => {
              const dayNumber = cellIndex - offset + 1;
              const isInCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
              const summary = isInCurrentMonth ? dailySummary.get(dayNumber) : undefined;
              const income = summary?.income ?? 0;
              const outcome = summary?.outcome ?? 0;

              return (
                <Grid key={cellIndex} size={1}>
                  <Stack
                    onClick={isInCurrentMonth ? () => onDayClick?.(dayNumber) : undefined}
                    sx={{
                      border: "1px solid rgba(11,110,79,0.16)",
                      borderRadius: 1,
                      minHeight: 78,
                      p: 0.5,
                      opacity: isInCurrentMonth ? 1 : 0.35,
                      cursor: isInCurrentMonth ? "pointer" : "default"
                    }}
                  >
                    <BodyText sx={{ fontWeight: 600 }}>{isInCurrentMonth ? dayNumber : ""}</BodyText>
                    {isInCurrentMonth ? (
                      <Tooltip title={`${inLabel}: ${amountFormatter.format(income)} | ${outLabel}: ${amountFormatter.format(outcome)}`}>
                        <Stack spacing={0}>
                          <BodyText
                            sx={{
                              color: "success.main",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%"
                            }}
                          >
                            {amountFormatter.format(income)}
                          </BodyText>
                          <BodyText
                            sx={{
                              color: "error.main",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%"
                            }}
                          >
                            {amountFormatter.format(outcome)}
                          </BodyText>
                        </Stack>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      )}
      {defaultCurrencyCode != null && defaultCurrencyCode.trim().length > 0 ? (
        <BodyText sx={{ mt: 1 }}>{defaultCurrencyCode}</BodyText>
      ) : null}
    </Paper>
  );
}
