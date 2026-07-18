import { useTheme as useMuiTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { layoutStyles } from "./theme";

const colors = {
  errorBg: "rgba(244,67,54,0.06)",
  errorBorder: "rgba(244,67,54,0.20)",
  successBg: "rgba(76,175,80,0.06)",
  successBorder: "rgba(76,175,80,0.20)",
  tagChipBorder: "rgba(255,134,76,0.28)",
  tagChipBg: "rgba(255,134,76,0.10)",
} as const;

export function useTheme() {
  const muiTheme = useMuiTheme<Theme>();
  return {
    ...muiTheme,
    colors,
    layoutStyles,
  };
}
