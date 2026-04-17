import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { appBasePath } from "./config/appBasePath";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";

export function App() {
  return (
    <BrowserRouter basename={appBasePath}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<ProtectedDashboard />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ProtectedDashboard() {
  const { status } = useAuth();

  if (status !== "authenticated") {
    return <Navigate replace to="/" />;
  }

  return <DashboardPage />;
}
