import {
  Navigate,
  Outlet,
  RouterProvider,
  type RouteObject,
  createBrowserRouter
} from "react-router-dom";
import { useState, type ReactNode } from "react";
import { AuthBootstrapBoundary } from "../../features/auth/components/AuthBootstrapBoundary";
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute";
import { useCurrentUserState } from "../../features/auth/hooks";
import { AuthCallbackPage } from "../../pages/auth-callback/AuthCallbackPage";
import { ChangePasswordPage } from "../../pages/change-password/ChangePasswordPage";
import { HomePage } from "../../pages/home/HomePage";
import { LoginPage } from "../../pages/login/LoginPage";
import { RoleAssignmentsPage } from "../../pages/role-assignments/RoleAssignmentsPage";
import { RolesPage } from "../../pages/roles/RolesPage";
import { UsersPage } from "../../pages/users/UsersPage";
import { WorkspacesPage } from "../../pages/workspaces/WorkspacesPage";
import { canAccessProtectedShellRoute } from "./protectedShellRoutes";

function RequireProtectedShellAccess({
  children,
  path
}: {
  children: ReactNode;
  path: string;
}) {
  const { data: currentUser, isPending } = useCurrentUserState();

  if (isPending) {
    return null;
  }

  if (!canAccessProtectedShellRoute(path, currentUser)) {
    return <HomePage />;
  }

  return <>{children}</>;
}

export const appRoutes: RouteObject[] = [
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
        path: "/workspaces",
        element: (
          <ProtectedRoute>
            <RequireProtectedShellAccess path="/workspaces">
              <WorkspacesPage />
            </RequireProtectedShellAccess>
          </ProtectedRoute>
        )
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute>
            <RequireProtectedShellAccess path="/users">
              <UsersPage />
            </RequireProtectedShellAccess>
          </ProtectedRoute>
        )
      },
      {
        path: "/roles",
        element: (
          <ProtectedRoute>
            <RequireProtectedShellAccess path="/roles">
              <RolesPage />
            </RequireProtectedShellAccess>
          </ProtectedRoute>
        )
      },
      {
        path: "/role-assignments",
        element: (
          <ProtectedRoute>
            <RequireProtectedShellAccess path="/role-assignments">
              <RoleAssignmentsPage />
            </RequireProtectedShellAccess>
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
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}

export function AppRouter() {
  const [router] = useState(createAppRouter);

  return <RouterProvider router={router} />;
}
