import { Navigate, Route, Routes } from "react-router-dom";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
