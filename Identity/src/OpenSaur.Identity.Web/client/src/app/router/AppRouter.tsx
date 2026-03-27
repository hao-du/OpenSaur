import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import { AuthBootstrapBoundary } from "../../features/auth/components/AuthBootstrapBoundary";
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute";
import { AuthCallbackPage } from "../../pages/auth-callback/AuthCallbackPage";
import { ChangePasswordPage } from "../../pages/change-password/ChangePasswordPage";
import { HomePage } from "../../pages/home/HomePage";
import { LoginPage } from "../../pages/login/LoginPage";

const router = createBrowserRouter([
  {
    element: (
      <AuthBootstrapBoundary>
        <Outlet />
      </AuthBootstrapBoundary>
    ),
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        )
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
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        )
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
