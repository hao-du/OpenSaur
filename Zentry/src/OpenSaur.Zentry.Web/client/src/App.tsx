import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { ForbiddenPage } from "./features/auth/pages/ForbiddenPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";
import { useAuthSession } from "./features/auth/hooks/AuthContext";
import { OidcClientsPage } from "./features/oidc-clients/pages/OidcClientsPage";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { MyProfilePage } from "./features/profile/pages/MyProfilePage";
import { RolesPage } from "./features/roles/pages/RolesPage";
import { UsersPage } from "./features/users/pages/UsersPage";
import { WorkspacesPage } from "./features/workspaces/pages/WorkspacesPage";

export function App() {
  const { authSession, isRestoring } = useAuthSession();

  return (
    <Routes>
      <Route element={isRestoring || authSession == null ? <Navigate replace to="/prepare-session" /> : <Outlet />}>
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
      <Route
        element={authSession == null ? <PrepareSessionPage isRestoring={isRestoring} /> : <Navigate replace to="/" />}
        path="/prepare-session"
      />
      <Route
        element={<AuthCallbackPage />}
        path="/auth/callback"
      />
    </Routes>
  );
}
