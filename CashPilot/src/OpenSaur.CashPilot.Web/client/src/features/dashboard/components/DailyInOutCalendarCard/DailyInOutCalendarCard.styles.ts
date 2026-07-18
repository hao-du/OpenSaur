import { alpha, type Theme } from "@mui/material/styles";

export const monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const calendarPaperSx = (theme: Theme) => ({
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
  borderRadius: 1,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  p: 1.5,
});

export const calendarCellSx = (theme: Theme, isInCurrentMonth: boolean) => ({
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  borderRadius: 1,
  backgroundColor: isInCurrentMonth
    ? alpha(theme.palette.background.paper, 0.95)
    : alpha(theme.palette.common.black, 0.025),
  boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.02)}`,
  minHeight: { xs: 72, sm: 82 },
  overflow: "hidden",
  p: { xs: 0.5, sm: 0.75 },
  transition: "transform 120ms ease, box-shadow 120ms ease",
  "&:hover": {
    boxShadow: isInCurrentMonth ? `0 6px 20px ${alpha(theme.palette.common.black, 0.07)}` : `0 1px 0 ${alpha(theme.palette.common.black, 0.02)}`,
    transform: isInCurrentMonth ? "translateY(-1px)" : "none",
  },
});
