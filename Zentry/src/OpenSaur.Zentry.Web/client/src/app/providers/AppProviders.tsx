import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { zentryTheme } from "../theme/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={zentryTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
