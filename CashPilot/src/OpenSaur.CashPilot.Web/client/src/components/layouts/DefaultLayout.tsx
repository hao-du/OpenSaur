import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useLocation } from "react-router-dom";
import { Header } from "../organisms/Header";
import { SideMenu } from "../organisms/SideMenu";
import { MainContent } from "../templates/MainContent";
import { layoutStyles } from "../../infrastructure/theme/theme";

type DefaultLayoutProps = PropsWithChildren<{
  beforeTitle?: ReactNode;
  headerActions?: ReactNode;
  subtitle?: string;
  title: string;
}>;

export function DefaultLayout({ beforeTitle, children, headerActions, subtitle, title }: DefaultLayoutProps) {
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const isOfflineWorkspace = location.pathname.startsWith("/offline");
  const currentYear = new Date().getFullYear();
  const sideMenu = isOfflineWorkspace ? null : <SideMenu currentYear={currentYear} />;

  return (
    <Box
      sx={layoutStyles.root}
    >
      {!isOfflineWorkspace ? (
        isDesktop ? (
          <Box
            component="aside"
            sx={layoutStyles.sidebar}
          >
            {sideMenu}
          </Box>
        ) : (
          <Drawer
            ModalProps={{ keepMounted: true }}
            onClose={() => {
              setIsNavigationOpen(false);
            }}
            open={isNavigationOpen}
            sx={layoutStyles.drawer}
            variant="temporary"
          >
            {sideMenu}
          </Drawer>
        )
      ) : null}
      <Box sx={layoutStyles.contentColumn}>
        <Header
          isDesktop={isDesktop}
          showAccountMenuItems={!isOfflineWorkspace}
          showNavigationToggle={!isOfflineWorkspace}
          onOpenNavigation={() => {
            setIsNavigationOpen(true);
          }}
        />
        <MainContent
          beforeTitle={beforeTitle}
          headerActions={headerActions}
          subtitle={subtitle}
          title={title}
        >
          {children}
        </MainContent>
      </Box>
    </Box>
  );
}
