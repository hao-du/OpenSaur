import { Outlet, Route, Routes } from "react-router-dom";
import { ForbiddenPage } from "./features/auth/pages/ForbiddenPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { OidcClientsPage } from "./features/oidc-clients/pages/OidcClientsPage";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { MyProfilePage } from "./features/profile/pages/MyProfilePage";
import { RolesPage } from "./features/roles/pages/RolesPage";
import { UsersPage } from "./features/users/pages/UsersPage";
import { WorkspacesPage } from "./features/workspaces/pages/WorkspacesPage";
import { Box, CircularProgress } from "@mui/material";

export function App() {
  const { isAuthenticated, isLoading } = useAuth({ autoRedirect: true });

  if (isLoading || !isAuthenticated) {
    return (
      <Box
        alignItems="center"
        display="flex"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          element={<DashboardPage />}
          path="/"
        />
        <Route
          element={<OidcClientsPage />}
          path="/oidc-clients"
        />
        <Route
          element={<WorkspacesPage />}
          path="/workspaces"
        />
        <Route
          element={<RolesPage />}
          path="/roles"
        />
        <Route
          element={<UsersPage />}
          path="/users"
        />
        <Route
          element={<SettingsPage />}
          path="/settings"
        />
        <Route
          element={<MyProfilePage />}
          path="/profile"
        />
        <Route
          element={<ForbiddenPage />}
          path="/forbidden"
        />
      </Route>
    </Routes>
  );
}


