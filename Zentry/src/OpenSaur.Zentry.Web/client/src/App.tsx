import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";
import { useAuthSession } from "./features/auth/hooks/useAuthSession";
import { DashboardPage } from "./pages/DashboardPage";

export function App() {
  const { authSession, isRestoring } = useAuthSession();

  return (
    <Routes>
      <Route element={isRestoring || authSession == null ? <Navigate replace to="/prepare-session" /> : <Outlet />}>
        <Route
          element={<DashboardPage />}
          path="/"
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
