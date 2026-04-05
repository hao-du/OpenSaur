import { useMemo, useState, type PropsWithChildren } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Trans } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getVisibleProtectedShellRoutes } from "../../app/router/protectedShellRoutes";
import {
  useCurrentUserQuery,
  useCurrentUserState,
  useExitImpersonation,
  useLogout
} from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { BrandMark } from "../atoms";
import { Menu } from "../../shared/icons";
import { ShellAccountMenu } from "./ShellAccountMenu";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

type ProtectedShellTemplateProps = PropsWithChildren<{
  subtitle?: string;
  title: string;
}>;

export function ProtectedShellTemplate({
  children,
  title,
  subtitle
}: ProtectedShellTemplateProps) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const { clearCurrentUser } = useCurrentUserQuery();
  const { data: currentUser } = useCurrentUserState();
  const { isLoggingOut, logout } = useLogout();
  const { exitImpersonation, isExitingImpersonation } = useExitImpersonation();
  const { t } = usePreferences();
  const visibleRoutes = useMemo(
    () => getVisibleProtectedShellRoutes(currentUser),
    [currentUser]
  );
  const workspaceName = currentUser?.workspaceName ?? t("shell.protectedWorkspace");
  const impersonatedDisplayName = useMemo(() => {
    const fullName = `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim();
    return fullName || currentUser?.userName || t("shell.impersonationFallbackUser");
  }, [currentUser?.firstName, currentUser?.lastName, currentUser?.userName, t]);
  const currentYear = new Date().getFullYear();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Clear the local session even if the server-side logout call fails.
    }

    clearCurrentUser();
    authSessionStore.clearSession();
    authSessionStore.clearRememberedReturnUrl();
    authSessionStore.broadcastSessionCleared();
    navigate("/login", { replace: true });
  }

  function handleNavigateToChangePassword() {
    navigate("/change-password", {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`
      }
    });
  }

  async function handleExitImpersonation() {
    try {
      const transition = await exitImpersonation({
        returnUrl: `${location.pathname}${location.search}${location.hash}`
      });
      window.location.assign(transition.redirectUrl);
    } catch {
      // Keep the current UI state if impersonation exit fails.
    }
  }

  function handleNavigateToProfile() {
    navigate("/profile");
  }

  function handleNavigateToSettings() {
    navigate("/settings");
  }

  const navigation = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
    >
      <BrandMark />
      <Divider sx={{ my: 3 }} />
      <List
        aria-label={t("shell.primaryNavigation")}
        component="nav"
        sx={{ p: 0 }}
      >
        {visibleRoutes.map(route => {
          const Icon = route.icon;

          return (
            <ListItemButton
              className={location.pathname === route.path ? "active" : undefined}
              component={NavLink}
              end={route.path === "/"}
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
              <ListItemIcon
                sx={{
                  color: "inherit",
                  minWidth: 40
                }}
              >
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText primary={route.labelKey ? t(route.labelKey) : route.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 3 }} />
      <Typography
        color="text.secondary"
        variant="body2"
      >
        {t("shell.copyright", { year: currentYear })}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        backgroundColor: "background.default",
        display: "flex",
        minHeight: "100vh"
      }}
    >
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
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              p: 3,
              width: 280
            }
          }}
          variant="temporary"
        >
          {navigation}
        </Drawer>
      )}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minWidth: 0
        }}
      >
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
          <Toolbar
            sx={{
              gap: 1.5,
              justifyContent: "space-between",
              minHeight: { xs: 72, md: 80 }
            }}
          >
            <Stack
              alignItems="center"
              direction="row"
              spacing={1.5}
            >
              {!isDesktop ? (
                <IconButton
                  aria-label={t("shell.openNavigation")}
                  edge="start"
                  onClick={() => {
                    setIsNavigationOpen(true);
                  }}
                >
                  <Menu size={20} />
                </IconButton>
              ) : null}
              <Stack
                spacing={0.5}
                sx={{ minWidth: 0 }}
              >
                <Stack
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                >
                  <Typography
                    color="primary.main"
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase"
                    }}
                    variant="overline"
                  >
                    {workspaceName}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1.5}
            >
              <ShellAccountMenu
                email={currentUser?.email}
                firstName={currentUser?.firstName}
                isLoggingOut={isLoggingOut}
                lastName={currentUser?.lastName}
                onChangePassword={handleNavigateToChangePassword}
                onOpenProfile={handleNavigateToProfile}
                onOpenSettings={handleNavigateToSettings}
                onLogout={() => {
                  void handleLogout();
                }}
                userName={currentUser?.userName}
              />
            </Stack>
          </Toolbar>
        </AppBar>
        {currentUser?.isImpersonating ? (
          <Alert
            action={(
              <Button
                aria-label={t("shell.exitImpersonation")}
                color="inherit"
                disabled={isExitingImpersonation}
                onClick={() => {
                  void handleExitImpersonation();
                }}
                size="small"
              >
                {t("shell.exitImpersonation")}
              </Button>
            )}
            role="alert"
            severity="success"
            sx={{
              borderRadius: 0
            }}
          >
            <Trans
              components={{ strong: <strong /> }}
              i18nKey="shell.impersonationBanner"
              values={{
                userName: impersonatedDisplayName,
                workspaceName
              }}
            />
          </Alert>
        ) : null}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 }
          }}
        >
          <Stack spacing={subtitle ? 4 : 2}>
            <Stack spacing={1}>
              <Typography
                component="h1"
                variant="h3"
              >
                {title}
              </Typography>
              {subtitle ? (
                <Typography color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>
            {children}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
