import {
  Navigate,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { AuthCallbackPage } from "../../pages/auth-callback/AuthCallbackPage";
import { ChangePasswordPage } from "../../pages/change-password/ChangePasswordPage";
import { HomePage } from "../../pages/home/HomePage";
import { LoginPage } from "../../pages/login/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />
  },
  {
    path: "/change-password",
    element: <ChangePasswordPage />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
