import { useState, type PropsWithChildren } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Header } from "../organisms/Header";
import { SideMenu } from "../organisms/SideMenu";
import { MainContent } from "../templates/MainContent";
import { layoutStyles } from "../../theme/theme";

type DefaultLayoutProps = PropsWithChildren<{
  subtitle?: string;
  title: string;
}>;

export function DefaultLayout({ children, subtitle, title }: DefaultLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const sideMenu = <SideMenu currentYear={currentYear} />;

  return (
    <Box
      sx={layoutStyles.root}
    >
      {isDesktop ? (
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
      )}
      <Box sx={layoutStyles.contentColumn}>
        <Header
          isDesktop={isDesktop}
          onOpenNavigation={() => {
            setIsNavigationOpen(true);
          }}
        />
        <MainContent
          subtitle={subtitle}
          title={title}
        >
          {children}
        </MainContent>
      </Box>
    </Box>
  );
}
