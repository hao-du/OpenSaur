import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { getAuthSession } from "./features/auth/storages/authStorage";

function ProtectedRoute() {
  const authSession = getAuthSession();

  if (authSession == null) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

export function App() {
  const authSession = getAuthSession();

  return (
    <Routes>
      <Route
        element={<ProtectedRoute />}
      >
        <Route
          element={<DashboardPage />}
          path="/"
        />
      </Route>
      <Route
        element={ authSession == null ? <LoginPage /> : <Navigate replace to="/" /> }
        path="/login"
      />
      <Route
        element={<AuthCallbackPage />}
        path="/auth/callback"
      />
    </Routes>
  );
}
