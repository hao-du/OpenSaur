import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      pageBackgrounds: {
        auth: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      pageBackgrounds?: {
        auth?: string;
      };
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0d3b66"
    },
    secondary: {
      main: "#ee6c4d"
    },
    background: {
      default: "#f6f1e9"
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h3: {
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 20
  },
  custom: {
    pageBackgrounds: {
      auth:
        "radial-gradient(circle at top left, rgba(238,108,77,0.22), transparent 32%), linear-gradient(135deg, #f6f1e9 0%, #d9e2ec 100%)"
    }
  }
});
