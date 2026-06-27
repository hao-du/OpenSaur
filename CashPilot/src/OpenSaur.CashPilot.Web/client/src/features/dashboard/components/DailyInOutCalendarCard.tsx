import { ChevronLeft, ChevronRight } from "lucide-react";
import { Grid, IconButton, MenuItem, Paper, Select, Stack, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { AppIcon } from "../../../components/icons/AppIcon";
import { formatAmount } from "../../../infrastructure/constants/numberFormatters";
import type {
  DailyInOutCalendarItemDto,
  MarkerCalendarDto,
} from "../../transactions/dtos/TransactionDto";
import type { TagDefinitionResponse } from "../../tags/dtos/TagDto";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  title: string;
  inLabel: string;
  outLabel: string;
  monthLabel: string;
  yearLabel: string;
  monthlyLabel: string;
  pastPeriodLabel: string;
  noDataAvailableLabel: string;
  noDefaultCurrencyLabel: string;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  isLoading?: boolean;
  defaultCurrencyCode?: string;
  dailyItems: DailyInOutCalendarItemDto[];
  markerCalendar?: MarkerCalendarDto;
  onDayClick?: (date: string) => void;
  markerTags?: TagDefinitionResponse[];
  selectedMarkerTag?: string;
  onMarkerTagChange?: (tagName: string) => void;
  onPreviousMarkerPeriod?: () => void;
  onNextMarkerPeriod?: () => void;
};

const monthNames = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
];
const MONTHLY_MARKER_VALUE = "__monthly__";

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildMonthLabel(date: Date, monthLabel: string) {
  return `${monthLabel} ${date.getUTCMonth() + 1}`;
}

export function DailyInOutCalendarCard({
  title,
  inLabel,
  outLabel,
  monthLabel,
  yearLabel,
  monthlyLabel,
  pastPeriodLabel,
  noDataAvailableLabel,
  noDefaultCurrencyLabel,
  year,
  month,
  onYearChange,
  onMonthChange,
  isLoading = false,
  defaultCurrencyCode,
  dailyItems,
  markerCalendar,
  onDayClick,
  markerTags,
  selectedMarkerTag,
  onMarkerTagChange,
  onPreviousMarkerPeriod,
  onNextMarkerPeriod
}: Props) {
  const { locale, todayIsoDate } = useSettings();
  const today = new Date(todayIsoDate);
  const isMarkerMode = selectedMarkerTag != null && selectedMarkerTag !== MONTHLY_MARKER_VALUE && markerCalendar != null;
  const yearOptions = useMemo(() => {
    const years = new Set<number>([year - 1, year, year + 1]);
    return Array.from(years).sort((a, b) => b - a);
  }, [year]);

  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDay = today.getUTCDate();
  const todayIso = formatIsoDate(today);

  const monthlySummary = useMemo(() => {
    const result = new Map<number, { income: number; outcome: number }>();
    dailyItems.forEach(item => {
      result.set(item.day, {
        income: item.income,
        outcome: item.outcome
      });
    });
    return result;
  }, [dailyItems]);

  const markerSummary = useMemo(() => {
    const result = new Map<string, { income: number; outcome: number }>();
    markerCalendar?.items.forEach(item => {
      result.set(item.transactionDate, {
        income: item.income,
        outcome: item.outcome
      });
    });
    return result;
  }, [markerCalendar]);

  const selectedPeriod = isMarkerMode
    ? markerCalendar?.periods[markerCalendar.selectedPeriodIndex]
    : undefined;

  const periodStart = selectedPeriod?.startDate != null ? parseIsoDate(selectedPeriod.startDate) : undefined;
  const periodEnd = selectedPeriod?.endDate != null ? parseIsoDate(selectedPeriod.endDate) : undefined;

  const markerRangeDays = useMemo(() => {
    if (periodStart == null || periodEnd == null || periodEnd < periodStart) {
      return [];
    }

    const days: Date[] = [];
    const current = new Date(periodStart);
    while (current <= periodEnd) {
      days.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
  }, [periodStart?.toISOString(), periodEnd?.toISOString()]);

  const monthlyDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthlyFirstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const monthlyOffset = (monthlyFirstDay + 6) % 7;
  const monthlyTotalCells = Math.ceil((monthlyOffset + monthlyDaysInMonth) / 7) * 7;

  const markerFirstDay = periodStart != null ? periodStart.getUTCDay() : 0;
  const markerOffset = (markerFirstDay + 6) % 7;
  const markerTotalCells = Math.ceil((markerOffset + markerRangeDays.length) / 7) * 7;
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

  const periodLabel = useMemo(() => {
    if (!isMarkerMode || selectedPeriod == null) {
      return "";
    }

    if (selectedPeriod.startDate == null) {
      return pastPeriodLabel;
    }

    if (selectedPeriod.endDate == null) {
      return selectedPeriod.startDate;
    }

    const start = parseIsoDate(selectedPeriod.startDate);
    const end = parseIsoDate(selectedPeriod.endDate);
    const startMonth = buildMonthLabel(start, monthLabel);
    const endMonth = buildMonthLabel(end, monthLabel);

    if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
      return `${startMonth} ${start.getUTCFullYear()}`;
    }

    if (start.getUTCFullYear() === end.getUTCFullYear()) {
      return `${startMonth} - ${endMonth} / ${start.getUTCFullYear()}`;
    }

    return `${startMonth} ${start.getUTCFullYear()} - ${endMonth} ${end.getUTCFullYear()}`;
  }, [isMarkerMode, monthLabel, pastPeriodLabel, selectedPeriod]);

  const canGoPreviousMarkerPeriod = isMarkerMode && markerCalendar != null && markerCalendar.selectedPeriodIndex > 0;
  const canGoNextMarkerPeriod =
    isMarkerMode &&
    markerCalendar != null &&
    markerCalendar.selectedPeriodIndex < markerCalendar.periods.length - 1;

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
          <Select
            size="small"
            value={selectedMarkerTag ?? MONTHLY_MARKER_VALUE}
            onChange={e => onMarkerTagChange?.(e.target.value as string)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value={MONTHLY_MARKER_VALUE}>{monthlyLabel}</MenuItem>
            {markerTags != null && markerTags.length > 0 ? markerTags.map(tag => (
              <MenuItem key={tag.id} value={tag.name}>
                {tag.name}
              </MenuItem>
            )) : null}
          </Select>

          <Tooltip title={isMarkerMode ? "Previous period" : "Previous month"}>
            <span>
              <IconButton
                aria-label={isMarkerMode ? "Previous period" : "Previous month"}
                disabled={isMarkerMode ? !canGoPreviousMarkerPeriod : false}
                onClick={isMarkerMode ? onPreviousMarkerPeriod : handlePreviousMonth}
                size="small"
              >
                <AppIcon icon={ChevronLeft} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isMarkerMode ? "Next period" : "Next month"}>
            <span>
              <IconButton
                aria-label={isMarkerMode ? "Next period" : "Next month"}
                disabled={isMarkerMode ? !canGoNextMarkerPeriod : false}
                onClick={isMarkerMode ? onNextMarkerPeriod : handleNextMonth}
                size="small"
              >
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </span>
          </Tooltip>

          {isMarkerMode ? (
            <BodyText sx={{ minWidth: 160, textAlign: "center", fontWeight: 600 }}>
              {periodLabel}
            </BodyText>
          ) : (
            <>
              <Select size="small" value={month.toString()} onChange={e => onMonthChange(Number(e.target.value))}>
                {monthNames.map((m, index) => (
                  <MenuItem key={m} value={(index + 1).toString()}>{`${monthLabel} ${m}`}</MenuItem>
                ))}
              </Select>
              <Select size="small" value={year.toString()} onChange={e => onYearChange(Number(e.target.value))}>
                {yearOptions.map(y => (
                  <MenuItem key={y} value={y.toString()}>{`${yearLabel} ${y}`}</MenuItem>
                ))}
              </Select>
            </>
          )}
        </Stack>
      </Stack>

      {isLoading ? (
        <BodyText>...</BodyText>
      ) : defaultCurrencyCode == null || defaultCurrencyCode.trim().length === 0 ? (
        <BodyText>{noDefaultCurrencyLabel}</BodyText>
      ) : isMarkerMode && selectedPeriod == null ? (
        <BodyText>{noDataAvailableLabel}</BodyText>
      ) : isMarkerMode ? (
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          {selectedPeriod?.startDate != null && selectedPeriod?.endDate != null ? (
            <BodyText sx={{ fontSize: 12, color: "text.secondary" }}>
              {selectedPeriod.startDate} - {selectedPeriod.endDate}
            </BodyText>
          ) : null}

          {markerRangeDays.length === 0 ? (
            <BodyText>{noDataAvailableLabel}</BodyText>
          ) : (
            <Grid container columns={7} spacing={0.5}>
              {weekDays.map(day => (
                <Grid key={day} size={1}>
                  <BodyText sx={{ fontWeight: 600, textAlign: "center" }}>{day}</BodyText>
                </Grid>
              ))}

              {Array.from({ length: markerTotalCells }).map((_, cellIndex) => {
                const dayIndex = cellIndex - markerOffset;
                const currentDate = markerRangeDays[dayIndex];
                const isInRange = currentDate != null;
                const currentIso = currentDate != null ? formatIsoDate(currentDate) : "";
                const isToday = currentIso === todayIso;
                const isMonthStart = currentDate != null && currentDate.getUTCDate() === 1;
                const summary = isInRange ? markerSummary.get(currentIso) : undefined;
                const income = summary?.income ?? 0;
                const outcome = summary?.outcome ?? 0;

                return (
                  <Grid key={cellIndex} size={1}>
                    <Stack
                      onClick={isInRange ? () => onDayClick?.(currentIso) : undefined}
                      sx={(theme) => ({
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                        borderRadius: 1,
                        backgroundColor: isToday
                          ? alpha(theme.palette.primary.main, 0.1)
                          : isMonthStart
                            ? alpha(theme.palette.secondary.main, 0.06)
                            : "transparent",
                        boxShadow: isToday
                          ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.45)}`
                          : isMonthStart
                            ? `inset 0 0 0 1px ${alpha(theme.palette.secondary.main, 0.45)}`
                            : "none",
                        minHeight: 78,
                        p: 0.5,
                        opacity: isInRange ? 1 : 0.35,
                        cursor: isInRange ? "pointer" : "default"
                      })}
                    >
                      <BodyText
                        sx={{
                          color: isToday ? "primary.main" : "text.primary",
                          fontWeight: isToday ? 700 : 600
                        }}
                      >
                        {isInRange ? currentDate.getUTCDate() : ""}
                      </BodyText>
                      {isInRange ? (
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
          )}
        </Stack>
      ) : (
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Grid container columns={7} spacing={0.5}>
            {weekDays.map(day => (
              <Grid key={day} size={1}>
                <BodyText sx={{ fontWeight: 600, textAlign: "center" }}>{day}</BodyText>
              </Grid>
            ))}

            {Array.from({ length: monthlyTotalCells }).map((_, cellIndex) => {
              const dayNumber = cellIndex - monthlyOffset + 1;
              const isInCurrentMonth = dayNumber >= 1 && dayNumber <= monthlyDaysInMonth;
              const isToday = isInCurrentMonth
                && year === todayYear
                && month === todayMonth
                && dayNumber === todayDay;
              const isMonthStart = isInCurrentMonth && dayNumber === 1;
              const summary = isInCurrentMonth ? monthlySummary.get(dayNumber) : undefined;
              const income = summary?.income ?? 0;
              const outcome = summary?.outcome ?? 0;

              return (
                <Grid key={cellIndex} size={1}>
                  <Stack
                    onClick={isInCurrentMonth ? () => onDayClick?.(formatIsoDate(new Date(Date.UTC(year, month - 1, dayNumber)))) : undefined}
                    sx={(theme) => ({
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                      borderRadius: 1,
                      backgroundColor: isToday
                        ? alpha(theme.palette.primary.main, 0.1)
                        : isMonthStart
                          ? alpha(theme.palette.secondary.main, 0.06)
                          : "transparent",
                      boxShadow: isToday
                        ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.45)}`
                        : isMonthStart
                          ? `inset 0 0 0 1px ${alpha(theme.palette.secondary.main, 0.45)}`
                          : "none",
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
