# Zentry Identity Shell Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the common Identity frontend shell into Zentry so authenticated Zentry pages render inside the same themed header, side navigation, and workspace layout while preserving the existing SPA OIDC flow.

**Architecture:** Keep Zentry's current auth/session modules as the source of truth, then layer an Identity-style MUI app shell around protected routes. Add a small app-level provider and theme stack, port only shell-focused shared components, and route authenticated pages through a protected shell layout while restyling callback and unauthenticated pages to match.

**Tech Stack:** React 19, TypeScript, Vite, React Router, MUI, Zentry SPA OIDC auth modules

---

## File Structure

### Create

- `src/OpenSaur.Zentry.Web/client/src/app/providers/AppProviders.tsx`
  Sets up `ThemeProvider` and `CssBaseline` for the whole SPA.
- `src/OpenSaur.Zentry.Web/client/src/app/theme/theme.ts`
  Defines the Identity-style Zentry theme.
- `src/OpenSaur.Zentry.Web/client/src/app/router/AppRouter.tsx`
  Centralizes browser router creation and top-level route definitions.
- `src/OpenSaur.Zentry.Web/client/src/app/router/shellRoutes.ts`
  Defines the visible Zentry shell navigation entries.
- `src/OpenSaur.Zentry.Web/client/src/components/shell/BrandMark.tsx`
  Renders the Zentry brand element used in the side navigation.
- `src/OpenSaur.Zentry.Web/client/src/components/shell/ShellAccountMenu.tsx`
  Renders the account avatar dropdown wired to Zentry session data.
- `src/OpenSaur.Zentry.Web/client/src/components/shell/ProtectedShellTemplate.tsx`
  Provides the Identity-style header, side navigation, and content workspace.
- `src/OpenSaur.Zentry.Web/client/src/components/layout/PageSectionCard.tsx`
  Provides a common card surface for dashboard and future pages.
- `src/OpenSaur.Zentry.Web/client/src/components/layout/PageIntro.tsx`
  Provides a reusable page title/subtitle header block.
- `src/OpenSaur.Zentry.Web/client/src/pages/AuthRequiredPage.tsx`
  Adds the public unauthenticated entry page in the new visual system.

### Modify

- `src/OpenSaur.Zentry.Web/client/package.json`
  Adds MUI dependencies required for the Identity shell port.
- `src/OpenSaur.Zentry.Web/client/src/main.tsx`
  Wraps the app in the new provider stack.
- `src/OpenSaur.Zentry.Web/client/src/App.tsx`
  Simplifies or removes the current inline router entrypoint in favor of `AppRouter`.
- `src/OpenSaur.Zentry.Web/client/src/pages/HomePage.tsx`
  Converts the current landing redirect page into the new auth-required page flow or removes it if superseded.
- `src/OpenSaur.Zentry.Web/client/src/pages/DashboardPage.tsx`
  Moves dashboard content into shared shell cards and sections.
- `src/OpenSaur.Zentry.Web/client/src/pages/AuthCallbackPage.tsx`
  Restyles the callback page to match the shell theme and reusable surfaces.
- `src/OpenSaur.Zentry.Web/client/src/auth/AuthProvider.tsx`
  Adds any small route-target updates needed for the new protected-shell landing path.
- `src/OpenSaur.Zentry.Web/client/src/components/AuthErrorPanel.tsx`
  Aligns the auth error panel with the new theme system.

### Verification Targets

- `src/OpenSaur.Zentry.Web/client`
- `src/OpenSaur.Zentry.slnx`

## Task 1: Add The Shell Dependencies And Provider Foundation

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/package.json`
- Create: `src/OpenSaur.Zentry.Web/client/src/app/providers/AppProviders.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/app/theme/theme.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/main.tsx`

- [ ] **Step 1: Add MUI packages to the client app**

Update `src/OpenSaur.Zentry.Web/client/package.json` dependencies so the client can render the Identity-style shell:

```json
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/material": "^7.3.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.4"
  }
}
```

- [ ] **Step 2: Install the new dependencies**

Run: `npm install`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: `package-lock.json` updated and install completes without errors.

- [ ] **Step 3: Add the Zentry app theme**

Create `src/OpenSaur.Zentry.Web/client/src/app/theme/theme.ts`:

```ts
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
```

- [ ] **Step 4: Add the app provider wrapper**

Create `src/OpenSaur.Zentry.Web/client/src/app/providers/AppProviders.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { zentryTheme } from "../theme/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={zentryTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 5: Wrap the React root with the provider stack**

Update `src/OpenSaur.Zentry.Web/client/src/main.tsx`:

```tsx
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProviders } from "./app/providers/AppProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

- [ ] **Step 6: Verify the foundation build**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: TypeScript and Vite build succeed with the new MUI dependencies.

## Task 2: Build The Zentry Shell Components

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/components/shell/BrandMark.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/shell/ShellAccountMenu.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/shell/ProtectedShellTemplate.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/layout/PageIntro.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/layout/PageSectionCard.tsx`

- [ ] **Step 1: Add the Zentry brand mark component**

Create `src/OpenSaur.Zentry.Web/client/src/components/shell/BrandMark.tsx`:

```tsx
import { Stack, Typography } from "@mui/material";

export function BrandMark() {
  return (
    <Stack spacing={0.5}>
      <Typography
        color="primary.main"
        sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.18em" }}
      >
        OpenSaur
      </Typography>
      <Typography variant="h5">
        Zentry
      </Typography>
      <Typography color="text.secondary" variant="body2">
        Workspace administration shell
      </Typography>
    </Stack>
  );
}
```

- [ ] **Step 2: Add the shell account menu**

Create `src/OpenSaur.Zentry.Web/client/src/components/shell/ShellAccountMenu.tsx`:

```tsx
import { useMemo, useState, type MouseEvent } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";

type ShellAccountMenuProps = {
  email?: string;
  onLogout: () => void;
  userName?: string;
};

function getInitials(userName?: string) {
  if (!userName) {
    return "ZE";
  }

  return userName.slice(0, 2).toUpperCase();
}

export function ShellAccountMenu({
  email,
  onLogout,
  userName
}: ShellAccountMenuProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const initials = useMemo(() => getInitials(userName), [userName]);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    setAnchorElement(event.currentTarget);
  }

  function handleClose() {
    setAnchorElement(null);
  }

  function handleLogout() {
    handleClose();
    onLogout();
  }

  return (
    <>
      <IconButton aria-label="Open account menu" onClick={handleOpen}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          {initials}
        </Avatar>
      </IconButton>
      <Menu anchorEl={anchorElement} onClose={handleClose} open={anchorElement !== null}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 600 }}>
              {userName ?? "Authenticated user"}
            </Typography>
            {email ? (
              <Typography color="text.secondary" variant="body2">
                {email}
              </Typography>
            ) : null}
          </Stack>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Log out</MenuItem>
      </Menu>
    </>
  );
}
```

- [ ] **Step 3: Add shared page framing primitives**

Create `src/OpenSaur.Zentry.Web/client/src/components/layout/PageIntro.tsx`:

```tsx
import { Stack, Typography } from "@mui/material";

type PageIntroProps = {
  subtitle?: string;
  title: string;
};

export function PageIntro({ subtitle, title }: PageIntroProps) {
  return (
    <Stack spacing={1}>
      <Typography component="h1" variant="h3">
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}
```

Create `src/OpenSaur.Zentry.Web/client/src/components/layout/PageSectionCard.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { Card, CardContent } from "@mui/material";

export function PageSectionCard({ children }: PropsWithChildren) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid rgba(11,110,79,0.10)",
        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)"
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {children}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Add the protected shell template**

Create `src/OpenSaur.Zentry.Web/client/src/components/shell/ProtectedShellTemplate.tsx`:

```tsx
import { useMemo, useState, type PropsWithChildren } from "react";
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
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { shellRoutes } from "../../app/router/shellRoutes";
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
        {`© ${currentYear} OpenSaur`}
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
```

- [ ] **Step 5: Verify the shell components compile**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Build succeeds with the new shell component files present.

## Task 3: Centralize Routing And Protected Shell Navigation

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/app/router/AppRouter.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/app/router/shellRoutes.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/App.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/auth/AuthProvider.tsx`

- [ ] **Step 1: Add the shell navigation route list**

Create `src/OpenSaur.Zentry.Web/client/src/app/router/shellRoutes.ts`:

```ts
export type ShellRoute = {
  label: string;
  path: string;
};

export const shellRoutes: ShellRoute[] = [
  {
    label: "Dashboard",
    path: "/"
  }
];
```

- [ ] **Step 2: Create the app router**

Create `src/OpenSaur.Zentry.Web/client/src/app/router/AppRouter.tsx`:

```tsx
import { useState } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject
} from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { appBasePath } from "../../config/appBasePath";
import { AuthCallbackPage } from "../../pages/AuthCallbackPage";
import { AuthRequiredPage } from "../../pages/AuthRequiredPage";
import { DashboardPage } from "../../pages/DashboardPage";

function ProtectedDashboardRoute() {
  const { status } = useAuth();

  if (status !== "authenticated") {
    return <Navigate replace to="/auth-required" />;
  }

  return <DashboardPage />;
}

const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ProtectedDashboardRoute />
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />
  },
  {
    path: "/auth-required",
    element: <AuthRequiredPage />
  },
  {
    path: "*",
    element: <Navigate replace to="/" />
  }
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes, {
    basename: appBasePath || undefined
  });
}

export function AppRouter() {
  const [router] = useState(createAppRouter);

  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Point the root app component at the router module**

Update `src/OpenSaur.Zentry.Web/client/src/App.tsx`:

```tsx
import { AuthProvider } from "./auth/AuthProvider";
import { AppRouter } from "./app/router/AppRouter";

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Update auth redirects to use the shell entry route**

Update the default redirects in `src/OpenSaur.Zentry.Web/client/src/auth/AuthProvider.tsx`:

```tsx
  async function signIn(redirectPath = "/") {
    setError(null);
    const url = await beginLogin(appEnvironment, redirectPath);
    window.location.assign(url);
  }
```

Keep `signOut()` behavior unchanged unless a route fallback needs to point to `/auth-required`.

- [ ] **Step 5: Verify route compilation**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Router compiles and no remaining imports reference the old inline route structure.

## Task 4: Move Dashboard Content Into The Protected Shell

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/pages/DashboardPage.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/layout/PageIntro.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/layout/PageSectionCard.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/components/shell/ProtectedShellTemplate.tsx`

- [ ] **Step 1: Rebuild the dashboard page around shell primitives**

Update `src/OpenSaur.Zentry.Web/client/src/pages/DashboardPage.tsx`:

```tsx
import { Grid, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/useAuth";
import { PageIntro } from "../components/layout/PageIntro";
import { PageSectionCard } from "../components/layout/PageSectionCard";
import { ProtectedShellTemplate } from "../components/shell/ProtectedShellTemplate";

export function DashboardPage() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const { profile, tokenSet } = session;

  return (
    <ProtectedShellTemplate
      subtitle="This phase proves the full browser flow: redirect, callback, code exchange, token storage, and authenticated identity bootstrap."
      title="Dashboard"
    >
      <PageIntro
        subtitle="Your Zentry session is authenticated through CoreGate."
        title="Workspace overview"
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSectionCard>
            <Stack spacing={1.5}>
              <Typography variant="h6">Identity</Typography>
              <Typography color="text.secondary">Subject: {profile.subject}</Typography>
              <Typography color="text.secondary">Username: {profile.preferredUsername ?? "Not provided"}</Typography>
              <Typography color="text.secondary">Email: {profile.email ?? "Not provided"}</Typography>
              <Typography color="text.secondary">Workspace: {profile.workspaceId ?? "Not provided"}</Typography>
              <Typography color="text.secondary">Roles: {profile.roles?.join(", ") ?? "Not provided"}</Typography>
            </Stack>
          </PageSectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageSectionCard>
            <Stack spacing={1.5}>
              <Typography variant="h6">Token snapshot</Typography>
              <Typography color="text.secondary">Token type: {tokenSet.tokenType}</Typography>
              <Typography color="text.secondary">Expires at: {tokenSet.expiresAtUtc}</Typography>
              <Typography color="text.secondary">Scope: {tokenSet.scope ?? "Not provided"}</Typography>
              <Typography color="text.secondary">Refresh token: {tokenSet.refreshToken ? "Issued" : "Not issued"}</Typography>
              <Typography color="text.secondary">ID token: {tokenSet.idToken ? "Issued" : "Not issued"}</Typography>
            </Stack>
          </PageSectionCard>
        </Grid>
      </Grid>
    </ProtectedShellTemplate>
  );
}
```

- [ ] **Step 2: Verify the dashboard renders through the shell**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: The dashboard compiles with the shell template and shared layout primitives.

## Task 5: Restyle Public Auth Pages To Match The New System

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/pages/AuthRequiredPage.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/pages/AuthCallbackPage.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/components/AuthErrorPanel.tsx`
- Modify or remove: `src/OpenSaur.Zentry.Web/client/src/pages/HomePage.tsx`

- [ ] **Step 1: Add the themed auth-required page**

Create `src/OpenSaur.Zentry.Web/client/src/pages/AuthRequiredPage.tsx`:

```tsx
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/useAuth";

export function AuthRequiredPage() {
  const { error, signIn, status } = useAuth();

  return (
    <Box
      sx={{
        alignItems: "center",
        background: "linear-gradient(135deg, #f4efe6 0%, #fffaf3 55%, #d8eef5 100%)",
        display: "grid",
        minHeight: "100vh",
        px: 3
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 560 }}>
        <Typography
          color="primary.main"
          sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          OpenSaur Zentry
        </Typography>
        <Typography variant="h2">
          Sign in with CoreGate
        </Typography>
        <Typography color="text.secondary">
          Zentry uses CoreGate for browser-based sign-in and returns you to the protected workspace shell once the token exchange completes.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box>
          <Button
            disabled={status === "loading"}
            onClick={() => {
              void signIn("/");
            }}
            size="large"
            variant="contained"
          >
            Continue to sign in
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Restyle the callback page with MUI**

Update `src/OpenSaur.Zentry.Web/client/src/pages/AuthCallbackPage.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { error, handleCallback, signIn, status } = useAuth();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    void handleCallback();
  }, [handleCallback]);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [navigate, status]);

  return (
    <Box sx={{ alignItems: "center", backgroundColor: "background.default", display: "grid", minHeight: "100vh", px: 3 }}>
      <Stack
        spacing={2}
        sx={{
          backgroundColor: "background.paper",
          border: "1px solid rgba(11,110,79,0.10)",
          borderRadius: 4,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          maxWidth: 544,
          p: 4
        }}
      >
        <Typography color="primary.main" sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          CoreGate callback
        </Typography>
        <Typography variant="h4">
          Completing your sign in
        </Typography>
        <Typography color="text.secondary">
          Zentry is validating state, exchanging the authorization code, and loading your profile.
        </Typography>
        {status === "error" && error ? (
          <Alert
            action={(
              <Button color="inherit" onClick={() => { void signIn("/"); }} size="small">
                Retry
              </Button>
            )}
            severity="error"
          >
            {error}
          </Alert>
        ) : null}
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 3: Bring the auth error panel onto the theme system**

Update `src/OpenSaur.Zentry.Web/client/src/components/AuthErrorPanel.tsx` to use MUI `Alert`, `Button`, and `Stack` instead of inline CSS so error presentation matches the rest of the shell.

```tsx
import { Alert, Button, Stack } from "@mui/material";

type AuthErrorPanelProps = {
  message: string;
  onRetry: () => void;
};

export function AuthErrorPanel({ message, onRetry }: AuthErrorPanelProps) {
  return (
    <Stack spacing={1.5}>
      <Alert
        action={(
          <Button color="inherit" onClick={onRetry} size="small">
            Retry
          </Button>
        )}
        severity="error"
      >
        {message}
      </Alert>
    </Stack>
  );
}
```

- [ ] **Step 4: Retire or redirect the old HomePage**

If `HomePage.tsx` is no longer referenced after the route move, either remove the file or replace its content with:

```tsx
import { Navigate } from "react-router-dom";

export function HomePage() {
  return <Navigate replace to="/auth-required" />;
}
```

- [ ] **Step 5: Verify the public auth pages**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Callback and auth-required pages compile and no route references point at removed public-page behavior.

## Task 6: Run Build And Manual Verification

**Files:**
- No code changes required unless verification exposes a defect.

- [ ] **Step 1: Build the client bundle**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Successful TypeScript and Vite build output.

- [ ] **Step 2: Build the Zentry solution**

Run: `dotnet build src/OpenSaur.Zentry.slnx`
Workdir: `C:\Code\New folder\OpenSaur\Zentry`
Expected: Solution builds successfully with the updated client assets and host project.

- [ ] **Step 3: Run the Zentry host for manual verification**

Run: `dotnet run --project src/OpenSaur.Zentry.Web`
Workdir: `C:\Code\New folder\OpenSaur\Zentry`
Expected: Local host starts successfully and serves the SPA on the configured development URLs.

- [ ] **Step 4: Perform manual browser checks**

Check the following behaviors in a browser:

```text
1. Open the Zentry app while signed out and confirm the auth-required page uses the new theme.
2. Click the sign-in button and confirm redirect to CoreGate.
3. Complete login and confirm return to the dashboard inside the new shell.
4. Confirm header, side menu, workspace framing, and account menu render correctly.
5. Confirm logout clears local session and returns to the unauthenticated path.
6. Resize to a narrow viewport and confirm the drawer navigation opens and closes correctly.
```

Expected: All checks pass without adding unit tests or automation tests.

## Self-Review

- Spec coverage check:
  - theme/provider port: Task 1
  - shell template, account menu, brand mark, common surfaces: Task 2
  - protected vs public routing split: Task 3
  - dashboard inside shell: Task 4
  - auth callback and auth-required styling alignment: Task 5
  - manual verification without automated tests: Task 6
- Placeholder scan:
  - no `TODO`, `TBD`, or deferred implementation markers remain in the plan steps
- Type consistency:
  - `AppProviders`, `AppRouter`, `shellRoutes`, `ProtectedShellTemplate`, `PageIntro`, and `PageSectionCard` names are used consistently across tasks
