import type { Localization } from "@mui/material/locale";
import { createTheme } from "@mui/material/styles";

export const appThemeOptions = {
  palette: {
    primary: {
      main: "#0b6e4f"
    },
    secondary: {
      main: "#1f3c88"
    },
    background: {
      default: "#f5f7f4",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 5
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h2: {
      fontWeight: 700
    },
    h3: {
      fontWeight: 700
    }
  }
} as const;

export function createAppTheme(localization: Localization) {
  return createTheme(appThemeOptions, localization);
}
