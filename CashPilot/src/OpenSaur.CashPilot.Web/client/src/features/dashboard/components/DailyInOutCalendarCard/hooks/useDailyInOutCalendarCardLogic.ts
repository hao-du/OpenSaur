import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../../../settings/provider/SettingProvider";
import { transactionDirectionValues } from "../../../../../infrastructure/constants/transactionEnums";
import type { TagDefinitionResponse } from "../../../../tags/dtos/TagDto";
import type { MarkerCalendarPeriodDto, TransactionListItemDto } from "../../../../transactions/dtos/TransactionDto";
import { useMarkerPeriodsQuery } from "../../../../transactions/hooks/dashboard/useMarkerPeriodsQuery";
import { useTransactionsByPeriodQuery } from "../../../../transactions/hooks/shared/useTransactionsByPeriodQuery";
import { monthNames } from "../DailyInOutCalendarCard.styles";

const MONTHLY_MODE_VALUE = "__monthly__";

type CalendarCell = {
  dateIso: string | null;
  dayLabel: number | null;
  income: number;
  outcome: number;
  isInRange: boolean;
};

type CalendarWeek = CalendarCell[];

type Props = {
  defaultCurrencyCode?: string;
  defaultMakerTagName?: string;
  markerOptions: TagDefinitionResponse[];
};

function toUtcDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getWeekStart(date: Date) {
  const offset = (date.getUTCDay() + 6) % 7;
  return addUtcDays(date, -offset);
}

function getWeekEnd(date: Date) {
  const offset = (date.getUTCDay() + 6) % 7;
  return addUtcDays(date, 6 - offset);
}

export function formatCurrencyAmount(amount: number) {
  return amount.toLocaleString();
}

function buildCalendarWeeks(startDate: Date, endDate: Date, transactions: TransactionListItemDto[]): CalendarWeek[] {
  const rangeStart = getWeekStart(startDate);
  const rangeEnd = getWeekEnd(endDate);
  const totalsMap = new Map<string, { income: number; outcome: number }>();

  for (const transaction of transactions) {
    const current = totalsMap.get(transaction.transactionDate) ?? { income: 0, outcome: 0 };
    if (transaction.direction === transactionDirectionValues.inflow) {
      current.income += transaction.amount;
    } else {
      current.outcome += transaction.amount;
    }
    totalsMap.set(transaction.transactionDate, current);
  }

  const cells: CalendarCell[] = [];
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = addUtcDays(cursor, 1)) {
    const isInRange = cursor >= startDate && cursor <= endDate;
    const dayLabel = isInRange ? cursor.getUTCDate() : null;
    const dateIso = isInRange ? toIsoDate(cursor) : null;
    const totals = totalsMap.get(toIsoDate(cursor)) ?? { income: 0, outcome: 0 };

    cells.push({
      dateIso,
      dayLabel,
      income: totals.income,
      outcome: totals.outcome,
      isInRange,
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function buildPeriodLabel(
  period: MarkerCalendarPeriodDto | undefined,
  monthLabel: string,
  pastPeriodLabel: string,
  loadingPeriodsLabel: string,
) {
  if (period == null) {
    return loadingPeriodsLabel;
  }

  if (period.startDate == null && period.endDate == null) {
    return pastPeriodLabel;
  }

  if (period.startDate == null) {
    return pastPeriodLabel;
  }

  if (period.endDate == null) {
    return `${period.startDate} + 30d`;
  }

  const start = new Date(`${period.startDate}T00:00:00Z`);
  const end = new Date(`${period.endDate}T00:00:00Z`);
  const startMonth = `${monthLabel} ${start.getUTCMonth() + 1}`;
  const endMonth = `${monthLabel} ${end.getUTCMonth() + 1}`;

  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return `${startMonth} ${start.getUTCFullYear()}`;
  }

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${startMonth} - ${endMonth} / ${start.getUTCFullYear()}`;
  }

  return `${startMonth} ${start.getUTCFullYear()} - ${endMonth} ${end.getUTCFullYear()}`;
}

export function useDailyInOutCalendarCardLogic({ defaultCurrencyCode, defaultMakerTagName, markerOptions }: Props) {
  const { t } = useSettings();
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const availableMarkerOptions = useMemo(
    () => markerOptions
      .filter(option => option.marker)
      .map(option => ({
        id: option.id,
        name: option.name.trim(),
      }))
      .filter(option => option.name.length > 0),
    [markerOptions],
  );
  const defaultMarkerOption = useMemo(() => {
    const defaultName = defaultMakerTagName?.trim();
    const defaultMatch = defaultName != null
      ? availableMarkerOptions.find(option => option.name === defaultName)
      : undefined;

    return defaultMatch?.id ?? availableMarkerOptions[0]?.id ?? MONTHLY_MODE_VALUE;
  }, [availableMarkerOptions, defaultMakerTagName]);

  const [selectedMode, setSelectedMode] = useState(defaultMarkerOption);
  const [calendarYear, setCalendarYear] = useState(today.getUTCFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getUTCMonth() + 1);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | undefined>();
  const userSelectedModeRef = useRef(false);

  useEffect(() => {
    if (!userSelectedModeRef.current && defaultMarkerOption.length > 0) {
      setSelectedMode(defaultMarkerOption);
    }
  }, [defaultMarkerOption]);

  const isMarkerMode = selectedMode !== MONTHLY_MODE_VALUE;
  const monthLabel = t("transactions.filter.month");
  const yearLabel = t("transactions.filter.year");
  const monthlyLabel = t("dashboard.monthly");
  const pastPeriodLabel = t("dashboard.pastPeriod");
  const weekDays = [
    t("dashboard.weekday.mon"),
    t("dashboard.weekday.tue"),
    t("dashboard.weekday.wed"),
    t("dashboard.weekday.thu"),
    t("dashboard.weekday.fri"),
    t("dashboard.weekday.sat"),
    t("dashboard.weekday.sun"),
  ];

  const markerPeriodsQuery = useMarkerPeriodsQuery(selectedMode, isMarkerMode);
  const markerPeriods = markerPeriodsQuery.data ?? [];

  useEffect(() => {
    if (!isMarkerMode) {
      setSelectedPeriodIndex(undefined);
      return;
    }

    if (markerPeriods.length === 0) {
      setSelectedPeriodIndex(undefined);
      return;
    }

    setSelectedPeriodIndex(current => {
      if (current == null) {
        return markerPeriods.length - 1;
      }

      return Math.min(current, markerPeriods.length - 1);
    });
  }, [isMarkerMode, markerPeriods.length, selectedMode]);

  const selectedPeriod = selectedPeriodIndex != null ? markerPeriods[selectedPeriodIndex] : undefined;

  const selectedRange = useMemo(() => {
    if (!isMarkerMode) {
      const start = new Date(Date.UTC(calendarYear, calendarMonth - 1, 1));
      const end = new Date(Date.UTC(calendarYear, calendarMonth, 0));
      return {
        endDate: toIsoDate(end),
        empty: false,
        startDate: toIsoDate(start),
        start: toUtcDate(start),
        end: toUtcDate(end),
      };
    }

    if (selectedPeriod == null) {
      return {
        endDate: null as string | null,
        empty: true,
        startDate: null as string | null,
        start: null as Date | null,
        end: null as Date | null,
      };
    }

    if (selectedPeriod.startDate == null && selectedPeriod.endDate == null) {
      return {
        endDate: null as string | null,
        empty: true,
        startDate: null as string | null,
        start: null as Date | null,
        end: null as Date | null,
      };
    }

    let startDate = selectedPeriod.startDate;
    let endDate = selectedPeriod.endDate;

    if (startDate == null && endDate != null) {
      const end = new Date(`${endDate}T00:00:00Z`);
      const start = addUtcDays(end, -30);
      startDate = toIsoDate(start);
    } else if (endDate == null && startDate != null) {
      const start = new Date(`${startDate}T00:00:00Z`);
      const end = addUtcDays(start, 30);
      endDate = toIsoDate(end);
    }

    if (startDate == null || endDate == null) {
      return {
        endDate: null as string | null,
        empty: true,
        startDate: null as string | null,
        start: null as Date | null,
        end: null as Date | null,
      };
    }

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    return {
      endDate,
      empty: false,
      startDate,
      start,
      end,
    };
  }, [calendarMonth, calendarYear, isMarkerMode, selectedPeriod]);

  const transactionsQuery = useTransactionsByPeriodQuery(selectedRange.startDate, selectedRange.endDate, !selectedRange.empty);
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const calendarWeeks = useMemo(() => {
    if (selectedRange.empty || selectedRange.start == null || selectedRange.end == null) {
      return [];
    }

    return buildCalendarWeeks(selectedRange.start, selectedRange.end, transactions);
  }, [selectedRange, transactions]);

  const yearOptions = useMemo(
    () => Array.from(new Set([calendarYear - 1, calendarYear, calendarYear + 1])).sort((a, b) => b - a),
    [calendarYear],
  );

  const periodLabel = isMarkerMode
    ? buildPeriodLabel(selectedPeriod, monthLabel, pastPeriodLabel, t("dashboard.loadingPeriods"))
    : `${monthLabel} ${monthNames[calendarMonth - 1]} / ${calendarYear}`;
  const selectedModeLabel = selectedMode === MONTHLY_MODE_VALUE ? monthlyLabel : availableMarkerOptions.find(option => option.id === selectedMode)?.name ?? selectedMode;

  function handlePreviousPeriod() {
    if (markerPeriods.length === 0) {
      return;
    }

    const currentIndex = selectedPeriodIndex ?? markerPeriods.length - 1;
    setSelectedPeriodIndex(Math.max(currentIndex - 1, 0));
  }

  function handleNextPeriod() {
    if (markerPeriods.length === 0) {
      return;
    }

    const currentIndex = selectedPeriodIndex ?? markerPeriods.length - 1;
    setSelectedPeriodIndex(Math.min(currentIndex + 1, markerPeriods.length - 1));
  }

  function handleDayClick(dateIso: string) {
    navigate(`/transactions?date=${dateIso}`);
  }

  return {
    availableMarkerOptions,
    calendarMonth,
    calendarWeeks,
    calendarYear,
    handleNextPeriod,
    handlePreviousPeriod,
    handleDayClick,
    isMarkerMode,
    isLoading: markerPeriodsQuery.isLoading || markerPeriodsQuery.isFetching || transactionsQuery.isLoading || transactionsQuery.isFetching,
    monthLabel,
    monthlyLabel,
    pastPeriodLabel,
    periodLabel,
    selectedMode,
    selectedModeLabel,
    setCalendarMonth,
    setCalendarYear,
    setSelectedMode: (value: string) => {
      userSelectedModeRef.current = true;
      setSelectedPeriodIndex(undefined);
      setSelectedMode(value);
    },
    yearLabel,
    yearOptions,
    weekDays,
    defaultCurrencyText: defaultCurrencyCode != null && defaultCurrencyCode.trim().length > 0 ? `(${defaultCurrencyCode})` : null,
    defaultMakerLabel: defaultMakerTagName != null && defaultMakerTagName.trim().length > 0
      ? `${t("dashboard.marker")}: ${defaultMakerTagName}`
      : `${t("dashboard.marker")}: ${t("dashboard.noDataAvailable")}`,
  };
}
