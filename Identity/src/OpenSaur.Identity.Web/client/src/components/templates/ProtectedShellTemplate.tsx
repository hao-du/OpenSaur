import { useMemo, useState, type MouseEvent, type PropsWithChildren } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu as MaterialMenu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getVisibleProtectedShellRoutes } from "../../app/router/protectedShellRoutes";
import { useCurrentUserQuery, useCurrentUserState, useLogout } from "../../features/auth/hooks";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { BrandMark } from "../atoms";
import {
  KeyRound,
  LogOut,
  Menu,
  Settings,
  UserRound
} from "../../shared/icons";

type ProtectedShellTemplateProps = PropsWithChildren<{
  impersonation?: {
    onExit?: () => void;
    workspaceName: string;
  };
  subtitle?: string;
  title: string;
}>;

function getUserInitials(userName?: string) {
  if (!userName) {
    return "CU";
  }

  const segments = userName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return segments
    .slice(0, 2)
    .map(segment => segment[0])
    .join("")
    .toUpperCase();
}

export function ProtectedShellTemplate({
  children,
  impersonation,
  title,
  subtitle
}: ProtectedShellTemplateProps) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | null>(null);
  const { clearCurrentUser } = useCurrentUserQuery();
  const { data: currentUser } = useCurrentUserState();
  const { isLoggingOut, logout } = useLogout();
  const visibleRoutes = useMemo(
    () => getVisibleProtectedShellRoutes(currentUser?.roles ?? []),
    [currentUser?.roles]
  );
  const isSuperAdministrator = (currentUser?.roles ?? []).includes("SuperAdministrator");
  const workspaceName = impersonation?.workspaceName
    ?? (isSuperAdministrator ? "All workspaces" : "Protected workspace");
  const accountInitials = getUserInitials(currentUser?.userName);
  const currentYear = new Date().getFullYear();

  async function handleLogout() {
    setAccountMenuAnchor(null);

    try {
      await logout();
    } catch {
      // Clear the local session even if the server-side logout call fails.
    }

    clearCurrentUser();
    authSessionStore.clearSession();
    authSessionStore.clearRememberedReturnUrl();
    navigate("/login", { replace: true });
  }

  function handleOpenAccountMenu(event: MouseEvent<HTMLElement>) {
    setAccountMenuAnchor(event.currentTarget);
  }

  function handleCloseAccountMenu() {
    setAccountMenuAnchor(null);
  }

  function handleNavigateToChangePassword() {
    setAccountMenuAnchor(null);
    navigate("/change-password", {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`
      }
    });
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
        aria-label="Primary navigation"
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
              <ListItemText primary={route.label} />
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
        Copyright (c) {currentYear}
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
                  aria-label="Open navigation"
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
                  {impersonation?.onExit ? (
                    <Button
                      onClick={impersonation.onExit}
                      size="small"
                      variant="outlined"
                    >
                      Exit impersonation
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Stack>
            <Stack
              alignItems="center"
              direction="row"
              spacing={1.5}
            >
              <IconButton
                aria-label="Open account menu"
                onClick={handleOpenAccountMenu}
                size="small"
              >
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    height: 40,
                    width: 40
                  }}
                >
                  {accountInitials}
                </Avatar>
              </IconButton>
              <MaterialMenu
                anchorEl={accountMenuAnchor}
                onClose={handleCloseAccountMenu}
                open={accountMenuAnchor !== null}
              >
                <MenuItem disabled>
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={1}
                  >
                    <UserRound size={16} />
                    <span>My Profile</span>
                  </Stack>
                </MenuItem>
                <MenuItem onClick={handleNavigateToChangePassword}>
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={1}
                  >
                    <KeyRound size={16} />
                    <span>Change password</span>
                  </Stack>
                </MenuItem>
                <MenuItem disabled>
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={1}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Stack>
                </MenuItem>
                <Divider />
                <MenuItem
                  disabled={isLoggingOut}
                  onClick={() => {
                    void handleLogout();
                  }}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    spacing={1}
                  >
                    {isLoggingOut ? <CircularProgress color="inherit" size={16} /> : <LogOut size={16} />}
                    <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
                  </Stack>
                </MenuItem>
              </MaterialMenu>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 4 }
          }}
        >
          <Stack spacing={subtitle ? 4 : 0}>
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
