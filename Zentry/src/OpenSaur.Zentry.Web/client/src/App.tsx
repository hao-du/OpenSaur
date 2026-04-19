import { Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./components/pages/AuthCallbackPage";
import { DashboardPage } from "./components/pages/DashboardPage";


export function App() {
  return (
      <Routes>
        <Route
          element={<DashboardPage />}
          path="/"
        />
        <Route
          element={<AuthCallbackPage />}
          path="/auth/callback"
        />
      </Routes>
  );
}
