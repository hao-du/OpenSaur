import { alpha, type Theme } from "@mui/material/styles";

export const markerPeriodsIncomeOutcomeCardPaperSx = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  p: 1.5,
};

export const markerPeriodsIncomeOutcomeHeaderRowSx = {
  alignItems: "center",
  display: "flex",
  gap: 1,
  justifyContent: "space-between",
};

export const markerPeriodsIncomeOutcomeModeSwitchSx = (theme: Theme) => ({
  alignItems: "center",
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  borderRadius: 999,
  display: "inline-flex",
  gap: 0.25,
  padding: 0.25,
});

export const markerPeriodsIncomeOutcomeModeButtonSx = (theme: Theme, active: boolean) => ({
  borderRadius: 999,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: 700,
  minWidth: 82,
  px: 1.25,
  py: 0.4,
  textTransform: "none",
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
});

export const markerPeriodsIncomeOutcomeSectionSx = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

export const markerPeriodsIncomeOutcomeRowSx = {
  alignItems: "flex-start",
  display: "flex",
  gap: 2,
  justifyContent: "space-between",
};

export const markerPeriodsIncomeOutcomeAmountSx = {
  fontVariantNumeric: "tabular-nums",
  minWidth: 160,
};
