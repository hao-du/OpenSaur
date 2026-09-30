import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useMarkerTagsQuery } from "../../transactions/hooks/dashboard/useMarkerTagsQuery";

type ReportType = "marker-monthly-income-outcome" | "date-range-income-outcome";

export function useReportsPageLogic() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("marker-monthly-income-outcome");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMarkerTag, setSelectedMarkerTag] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(`${currentYear}-01`);
  const [toDate, setToDate] = useState<string>(`${currentYear}-12`);
  const markerTagsQuery = useMarkerTagsQuery();
  const currenciesQuery = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });

  const markerTagOptions = useMemo(() => {
    return (markerTagsQuery.data ?? [])
      .map((tag) => tag.name.trim())
      .filter((value) => value.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [markerTagsQuery.data]);

  const defaultMakerTag = markerTagsQuery.data?.find((tag) => tag.isDefaultMaker) ?? null;
  const resolvedDefaultMakerTag = defaultMakerTag?.name.trim() ?? "";
  const hasAppliedDefaultRef = useRef(false);

  useEffect(() => {
    if (!hasAppliedDefaultRef.current && resolvedDefaultMakerTag.length > 0) {
      hasAppliedDefaultRef.current = true;
      setSelectedMarkerTag(resolvedDefaultMakerTag);
    }
  }, [resolvedDefaultMakerTag]);

  const defaultCurrency = currenciesQuery.data?.find((currency) => currency.isDefault) ?? null;

  return {
    defaultCurrencyCode: defaultCurrency?.shortName ?? "",
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
  };
}
