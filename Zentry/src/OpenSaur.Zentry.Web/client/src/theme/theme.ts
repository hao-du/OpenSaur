import { createTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

const headerHeight = 64;
const shellSpace = 2;

export const theme = createTheme({
  palette: {
    background: {
      default: "#f5f7f4",
      paper: "#ffffff"
    },
    primary: {
      main: "#0b6e4f"
    },
    text: {
      primary: "#15211b",
      secondary: "#5f6c65"
    }
  },
  shape: {
    borderRadius: 5
  },
  typography: {
    fontFamily: "\"Segoe UI\", \"Helvetica Neue\", sans-serif",
    h3: {
      fontSize: "2.2rem",
      fontWeight: 700
    }
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(11,110,79,0.10)"
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
    borderRight: "1px solid rgba(11,110,79,0.10)",
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
    backgroundColor: "rgba(245,247,244,0.92)",
    borderBottom: "1px solid rgba(11,110,79,0.10)"
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
    "&:first-of-type": {
      backgroundColor: "rgba(11,110,79,0.10)",
      color: "primary.main"
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
  }
};
