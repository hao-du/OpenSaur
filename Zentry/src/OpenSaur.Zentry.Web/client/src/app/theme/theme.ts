import { createTheme } from "@mui/material/styles";

export const zentryTheme = createTheme({
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
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          textTransform: "none"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18
        }
      }
    }
  }
});
