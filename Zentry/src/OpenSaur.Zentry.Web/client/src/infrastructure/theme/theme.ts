import { createTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

const headerHeight = 64;
const shellSpace = 2;
const brandGreen = "#0b6e4f";
const backgroundDefault = "#f5f7f4";
const backgroundPaper = "#ffffff";
const textPrimary = "#15211b";
const textSecondary = "#5f6c65";
const borderSubtle = "rgba(11,110,79,0.10)";
const borderDefault = "rgba(11,110,79,0.12)";
const borderStrong = "rgba(11,110,79,0.24)";
const navSelected = "rgba(11,110,79,0.10)";
const navSelectedHover = "rgba(11,110,79,0.14)";
const headerSurface = "rgba(245,247,244,0.92)";

export const theme = createTheme({
  palette: {
    background: {
      default: backgroundDefault,
      paper: backgroundPaper
    },
    primary: {
      main: brandGreen
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary
    }
  },
  shape: {
    borderRadius: 5
  },
  typography: {
    fontSize: 14,
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
    h3: {
      fontSize: "2.2rem",
      fontWeight: 700
    }
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: borderSubtle
        }
      }
    }
  }
});

export const layoutStyles: Record<string, SxProps<Theme>> = {
  root: {
    backgroundColor: "background.default",
    display: "flex",
    minHeight: "100vh"
  },
  sidebar: {
    backgroundColor: "background.paper",
    borderRight: `1px solid ${borderSubtle}`,
    flexShrink: 0,
    pt: 0,
    width: 280
  },
  drawer: {
    "& .MuiDrawer-paper": {
      boxSizing: "border-box",
      pt: 0,
      width: 280
    }
  },
  contentColumn: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minWidth: 0
  },
  mainContent: {
    flex: 1,
    px: shellSpace,
    py: shellSpace
  },
  headerBar: {
    backdropFilter: "blur(18px)",
    backgroundColor: headerSurface,
    borderBottom: `1px solid ${borderSubtle}`
  },
  headerToolbar: {
    gap: shellSpace,
    height: headerHeight,
    justifyContent: "space-between",
    px: shellSpace
  },
  sidebarContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    px: shellSpace,
    pb: shellSpace
  },
  sidebarBrandRow: {
    alignItems: "center",
    display: "flex",
    height: headerHeight
  },
  sidebarBrandText: {
    fontSize: "2rem",
    letterSpacing: "0.08em"
  },
  fullWidthDivider: {
    mx: -shellSpace
  },
  fullWidthDividerSpacing: {
    mx: -shellSpace,
    my: shellSpace
  },
  navList: {
    mt: shellSpace,
    p: 0
  },
  navItem: {
    borderRadius: 1,
    mb: 0.75,
    px: 1.5,
    py: 1.25,
    "&.Mui-selected": {
      backgroundColor: navSelected,
      color: "primary.main"
    },
    "&.Mui-selected:hover": {
      backgroundColor: navSelectedHover
    }
  },
  navItemIcon: {
    color: "inherit",
    minWidth: 40
  },
  flexGrow: {
    flexGrow: 1
  },
  avatarButton: {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    height: 40,
    width: 40
  },
  responsiveActionButton: {
    width: { md: "auto", xs: "100%" }
  },
  responsiveActionGroup: {
    width: { md: "auto", xs: "100%" }
  },
  sideMenuHeaderMeta: {
    minWidth: 0
  },
  impersonationIndicator: {
    alignItems: "center",
    border: `1px solid ${borderStrong}`,
    borderRadius: 999,
    color: "primary.main",
    display: "inline-flex",
    height: 28,
    justifyContent: "center",
    width: 28
  },
  menuProfileContent: {
    px: 2,
    py: 1.5
  },
  menuActionGroup: {
    py: 0.75
  },
  drawerPaperWide: {
    "& .MuiDrawer-paper": {
      p: 3,
      width: { sm: 620, xs: "100%" }
    }
  },
  drawerPaperNarrow: {
    "& .MuiDrawer-paper": {
      p: 3,
      width: { sm: 480, xs: "100%" }
    }
  },
  drawerContent: {
    height: "100%"
  },
  drawerLoadingState: {
    flex: 1
  },
  drawerBody: {
    flex: 1
  },
  formFooterRow: {
    mt: "auto"
  },
  dialogActions: {
    px: 3,
    pb: 3
  },
  borderedPanel: {
    border: `1px solid ${borderDefault}`
  },
  borderedPanelScrollable: {
    border: `1px solid ${borderDefault}`,
    overflowX: "auto"
  },
  emptyStatePanel: {
    border: `1px dashed ${borderStrong}`,
    p: 4
  },
  loadingPanel: {
    border: `1px solid ${borderDefault}`,
    p: 4
  }
};
