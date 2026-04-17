import { useMemo, useState, type PropsWithChildren } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { shellRoutes } from "../../app/router/shellRoutes";
import { useAuth } from "../../auth/useAuth";
import { BrandMark } from "./BrandMark";
import { ShellAccountMenu } from "./ShellAccountMenu";

type ProtectedShellTemplateProps = PropsWithChildren<{
  subtitle?: string;
  title: string;
}>;

export function ProtectedShellTemplate({
  children,
  subtitle,
  title
}: ProtectedShellTemplateProps) {
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const { session, signOut } = useAuth();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const navigation = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <BrandMark />
      <Divider sx={{ my: 3 }} />
      <List component="nav" sx={{ p: 0 }}>
        {shellRoutes.map(route => (
          <ListItemButton
            className={location.pathname === route.path ? "active" : undefined}
            component={NavLink}
            key={route.path}
            onClick={() => {
              setIsNavigationOpen(false);
            }}
            sx={{
              borderRadius: 1,
              mb: 0.75,
              px: 1.5,
              py: 1.25,
              "&.active": {
                backgroundColor: "rgba(11,110,79,0.10)",
                color: "primary.main"
              }
            }}
            to={route.path}
          >
            <ListItemText primary={route.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 3 }} />
      <Typography color="text.secondary" variant="body2">
        {`Copyright ${currentYear} OpenSaur`}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ backgroundColor: "background.default", display: "flex", minHeight: "100vh" }}>
      {isDesktop ? (
        <Box
          component="aside"
          sx={{
            backgroundColor: "background.paper",
            borderRight: "1px solid rgba(11,110,79,0.10)",
            flexShrink: 0,
            px: 3,
            py: 3.5,
            width: 280
          }}
        >
          {navigation}
        </Box>
      ) : (
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => {
            setIsNavigationOpen(false);
          }}
          open={isNavigationOpen}
          sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box", p: 3, width: 280 } }}
        >
          {navigation}
        </Drawer>
      )}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <AppBar
          color="transparent"
          elevation={0}
          position="sticky"
          sx={{
            backdropFilter: "blur(18px)",
            backgroundColor: "rgba(245,247,244,0.92)",
            borderBottom: "1px solid rgba(11,110,79,0.10)"
          }}
        >
          <Toolbar sx={{ gap: 1.5, justifyContent: "space-between", minHeight: { xs: 72, md: 80 } }}>
            <Stack alignItems="center" direction="row" spacing={1.5}>
              {!isDesktop ? (
                <IconButton
                  aria-label="Open navigation"
                  edge="start"
                  onClick={() => {
                    setIsNavigationOpen(true);
                  }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              ) : null}
              <Stack spacing={0.5}>
                <Typography
                  color="primary.main"
                  sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }}
                  variant="overline"
                >
                  {session?.profile.workspaceId ?? "Zentry"}
                </Typography>
                <Typography variant="h6">
                  {title}
                </Typography>
              </Stack>
            </Stack>
            <ShellAccountMenu
              email={session?.profile.email}
              onLogout={signOut}
              userName={session?.profile.preferredUsername}
            />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
          <Stack spacing={subtitle ? 4 : 2}>
            {subtitle ? (
              <Typography color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
            {children}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
