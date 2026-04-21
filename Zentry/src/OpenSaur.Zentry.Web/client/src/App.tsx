import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";
import { useAuthSession } from "./features/auth/hooks/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { OidcClientsPage } from "./pages/OidcClientsPage";

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
