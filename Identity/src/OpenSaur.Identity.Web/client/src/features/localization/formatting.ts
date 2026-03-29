import { useMemo } from "react";
import { useIntl, type IntlShape } from "react-intl";

type TemporalValue = Date | number | string;

type DateFormatOptions = Parameters<IntlShape["formatDate"]>[1];
type TimeFormatOptions = Parameters<IntlShape["formatTime"]>[1];
type NumberFormatOptions = Parameters<IntlShape["formatNumber"]>[1];
type RelativeTimeFormatOptions = Parameters<IntlShape["formatRelativeTime"]>[2];

function normalizeTemporalValue(value: TemporalValue) {
  return value instanceof Date
    ? value
    : new Date(value);
}

export function useLocalizedFormatting() {
  const intl = useIntl();

  return useMemo(() => ({
    formatDate: (value: TemporalValue, options?: DateFormatOptions) =>
      intl.formatDate(normalizeTemporalValue(value), options),
    formatDateTime: (value: TemporalValue, options?: DateFormatOptions) =>
      intl.formatDate(normalizeTemporalValue(value), options),
    formatNumber: (value: number, options?: NumberFormatOptions) =>
      intl.formatNumber(value, options),
    formatRelativeTime: (
      value: number,
      unit: Parameters<IntlShape["formatRelativeTime"]>[1],
      options?: RelativeTimeFormatOptions
    ) => intl.formatRelativeTime(value, unit, options),
    formatTime: (value: TemporalValue, options?: TimeFormatOptions) =>
      intl.formatTime(normalizeTemporalValue(value), options),
    locale: intl.locale
  }), [intl]);
}
