import { ChevronLeft, ChevronRight } from "lucide-react";
import { Grid, IconButton, MenuItem, Paper, Select, Stack, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { AppIcon } from "../../../components/icons/AppIcon";
import { formatAmount } from "../../../infrastructure/constants/numberFormatters";
import type { DailyInOutCalendarItemDto } from "../../transactions/dtos/TransactionDto";
import { useSettings } from "../../settings/provider/SettingProvider";

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
  const { locale, todayIsoDate } = useSettings();
  const today = new Date(todayIsoDate);
  const yearOptions = useMemo(() => {
    const years = new Set<number>([year - 1, year, year + 1]);
    return Array.from(years).sort((a, b) => b - a);
  }, [year]);

  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDay = today.getUTCDate();

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

  function handlePreviousMonth() {
    if (month === 1) {
      onYearChange(year - 1);
      onMonthChange(12);
      return;
    }

    onMonthChange(month - 1);
  }

  function handleNextMonth() {
    if (month === 12) {
      onYearChange(year + 1);
      onMonthChange(1);
      return;
    }

    onMonthChange(month + 1);
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PageTitleText variant="h6">{title}</PageTitleText>
          {defaultCurrencyCode != null && defaultCurrencyCode.trim().length > 0 ? (
            <BodyText>{`(${defaultCurrencyCode})`}</BodyText>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Previous month">
            <IconButton aria-label="Previous month" onClick={handlePreviousMonth} size="small">
              <AppIcon icon={ChevronLeft} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next month">
            <IconButton aria-label="Next month" onClick={handleNextMonth} size="small">
              <AppIcon icon={ChevronRight} />
            </IconButton>
          </Tooltip>
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
              const isToday = isInCurrentMonth
                && year === todayYear
                && month === todayMonth
                && dayNumber === todayDay;
              const summary = isInCurrentMonth ? dailySummary.get(dayNumber) : undefined;
              const income = summary?.income ?? 0;
              const outcome = summary?.outcome ?? 0;

              return (
                <Grid key={cellIndex} size={1}>
                  <Stack
                    onClick={isInCurrentMonth ? () => onDayClick?.(dayNumber) : undefined}
                    sx={(theme) => ({
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                      borderRadius: 1,
                      backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                      boxShadow: isToday ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.45)}` : "none",
                      minHeight: 78,
                      p: 0.5,
                      opacity: isInCurrentMonth ? 1 : 0.35,
                      cursor: isInCurrentMonth ? "pointer" : "default"
                    })}
                  >
                    <BodyText
                      sx={{
                        color: isToday ? "primary.main" : "text.primary",
                        fontWeight: isToday ? 700 : 600
                      }}
                    >
                      {isInCurrentMonth ? dayNumber : ""}
                    </BodyText>
                    {isInCurrentMonth ? (
                      <Tooltip title={`${inLabel}: ${formatAmount(income, locale)} | ${outLabel}: ${formatAmount(outcome, locale)}`}>
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
                            {formatAmount(income, locale)}
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
                            {formatAmount(outcome, locale)}
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
    </Paper>
  );
}
