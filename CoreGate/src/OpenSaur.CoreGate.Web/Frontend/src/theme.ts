import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      border: {
        subtle: string;
        strong: string;
      };
      pageBackgrounds: {
        auth: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      border?: {
        subtle?: string;
        strong?: string;
      };
      pageBackgrounds?: {
        auth?: string;
      };
    };
  }
}

const brandRed = "#a12828";
const brandRedDark = "#7f1d1d";
const brandRedLight = "#c24141";
const backgroundDefault = "#f8f4f2";
const backgroundPaper = "#ffffff";
const textPrimary = "#231815";
const textSecondary = "#6c5b57";
const borderSubtle = "rgba(161,40,40,0.12)";
const borderStrong = "rgba(161,40,40,0.20)";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brandRed,
      dark: brandRedDark,
      light: brandRedLight,
      contrastText: "#fff8f6"
    },
    secondary: {
      main: "#d97757"
    },
    background: {
      default: backgroundDefault,
      paper: backgroundPaper
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary
    }
  },
  typography: {
    fontFamily: [
      "\"Noto Sans\"",
      "\"Noto Sans SC\"",
      "\"Noto Sans TC\"",
      "\"Microsoft YaHei\"",
      "\"PingFang SC\"",
      "\"Segoe UI\"",
      "\"Helvetica Neue\"",
      "sans-serif"
    ].join(", "),
    fontSize: 14,
    h3: {
      fontSize: "2.1rem",
      fontWeight: 700
    },
    button: {
      fontWeight: 700,
      letterSpacing: "0.02em",
      textTransform: "none"
    }
  },
  shape: {
    borderRadius: 5
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: textPrimary
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: backgroundPaper,
          backgroundImage: "none",
          border: `1px solid ${borderSubtle}`,
          boxShadow: "0 32px 80px rgba(90,32,24,0.10)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          minHeight: 52
        },
        containedPrimary: {
          boxShadow: "none"
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined"
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.92)",
          "& fieldset": {
            borderColor: borderSubtle
          },
          "&:hover fieldset": {
            borderColor: borderStrong
          },
          "&.Mui-focused fieldset": {
            borderColor: brandRed
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: textSecondary
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 5
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: borderSubtle
        }
      }
    }
  },
  custom: {
    border: {
      subtle: borderSubtle,
      strong: borderStrong
    },
    pageBackgrounds: {
      auth: "#f8f4f2"
    }
  }
});
