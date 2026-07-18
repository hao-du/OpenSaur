import { Button, Paper, Skeleton, Stack } from "@mui/material";
import { useState } from "react";
import { BodyText } from "../../../../components/atoms/BodyText";
import { PageTitleText } from "../../../../components/atoms/PageTitleText";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { useIncomeOutcomeLatestPeriodsQuery } from "../../../transactions/hooks/dashboard/useIncomeOutcomeLatestPeriodsQuery";
import {
  markerPeriodsIncomeOutcomeAmountSx,
  markerPeriodsIncomeOutcomeCardPaperSx,
  markerPeriodsIncomeOutcomeHeaderRowSx,
  markerPeriodsIncomeOutcomeModeButtonSx,
  markerPeriodsIncomeOutcomeModeSwitchSx,
  markerPeriodsIncomeOutcomeRowSx,
  markerPeriodsIncomeOutcomeSectionSx,
} from "./MarkerPeriodsIncomeOutcomeCard.styles";

type Props = {
  title: string;
  currencyCode?: string;
  defaultMakerTagName?: string;
};

type Mode = "monthly" | "marker";

function SummaryRow({
  formatAmount,
  label,
  income,
  outcome,
}: {
  formatAmount: (value: number) => string;
  label: string;
  income: number;
  outcome: number;
}) {

  return (
    <Stack direction="row" spacing={2} sx={markerPeriodsIncomeOutcomeRowSx}>
      <BodyText sx={{ minWidth: 110, pt: 0.25 }}>{label}</BodyText>
      <Stack spacing={0.25} sx={markerPeriodsIncomeOutcomeAmountSx}>
        <BodyText sx={{ color: "success.main", textAlign: "right" }}>{`+${formatAmount(income)}`}</BodyText>
        <BodyText sx={{ color: "error.main", textAlign: "right" }}>{`-${formatAmount(outcome)}`}</BodyText>
      </Stack>
    </Stack>
  );
}

function formatPeriodLabel(
  mode: Mode,
  pastPeriodLabel: string,
  period: { startDate: string | null; endDate: string | null; year: number | null; month: number | null },
) {
  if (mode === "monthly" && period.year != null && period.month != null) {
    return `${period.year}-${String(period.month).padStart(2, "0")}`;
  }

  if (mode === "marker" && period.startDate == null) {
    return pastPeriodLabel;
  }

  const startLabel = period.startDate ? period.startDate.slice(0, 10) : "";
  const endLabel = period.endDate ? period.endDate.slice(0, 10) : "";

  if (startLabel.length > 0 && endLabel.length > 0) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel || endLabel || "";
}

export function MarkerPeriodsIncomeOutcomeCard({ title, currencyCode, defaultMakerTagName }: Props) {
  const { formatAmount, t } = useSettings();
  const [mode, setMode] = useState<Mode>(defaultMakerTagName != null && defaultMakerTagName.trim().length > 0 ? "marker" : "monthly");
  const latestPeriodsQuery = useIncomeOutcomeLatestPeriodsQuery(mode === "monthly");
  const pastPeriodLabel = t("dashboard.pastPeriod");

  const rows = latestPeriodsQuery.data?.items ?? [];
  const isLoading = latestPeriodsQuery.isLoading || latestPeriodsQuery.isFetching;

  return (
    <Paper variant="outlined" sx={markerPeriodsIncomeOutcomeCardPaperSx}>
      <Stack direction="row" spacing={1} sx={markerPeriodsIncomeOutcomeHeaderRowSx}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <PageTitleText variant="h6">{title}</PageTitleText>
          {currencyCode != null && currencyCode.trim().length > 0 ? <BodyText>{`(${currencyCode})`}</BodyText> : null}
        </Stack>
        <Stack direction="row" sx={theme => markerPeriodsIncomeOutcomeModeSwitchSx(theme)}>
          <Button
            onClick={() => setMode("monthly")}
            sx={theme => markerPeriodsIncomeOutcomeModeButtonSx(theme, mode === "monthly")}
            variant="text"
          >
            {t("dashboard.monthly")}
          </Button>
          <Button
            onClick={() => setMode("marker")}
            sx={theme => markerPeriodsIncomeOutcomeModeButtonSx(theme, mode === "marker")}
            variant="text"
          >
            {defaultMakerTagName != null && defaultMakerTagName.trim().length > 0
              ? defaultMakerTagName.trim()
              : t("dashboard.monthly")}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.25} sx={{ mt: 0.75, flex: 1 }}>
        <Stack spacing={1.25} sx={markerPeriodsIncomeOutcomeSectionSx}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Stack key={index} direction="row" spacing={2} sx={markerPeriodsIncomeOutcomeRowSx}>
                <Skeleton height={24} variant="text" width="45%" />
                <Stack spacing={0.25} sx={markerPeriodsIncomeOutcomeAmountSx}>
                  <Skeleton height={20} variant="text" width="70%" />
                  <Skeleton height={20} variant="text" width="70%" />
                </Stack>
              </Stack>
            ))
          ) : (
            rows.map(row => (
              <SummaryRow
                key={`${row.startDate ?? row.endDate ?? row.year ?? "row"}-${row.month ?? "all"}`}
                formatAmount={formatAmount}
                income={row.income}
                label={formatPeriodLabel(mode, pastPeriodLabel, row)}
                outcome={row.outcome}
              />
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
