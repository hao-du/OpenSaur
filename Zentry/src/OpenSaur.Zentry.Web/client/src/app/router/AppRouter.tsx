import { useState } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject
} from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { appBasePath } from "../../config/appBasePath";
import { AuthCallbackPage } from "../../pages/AuthCallbackPage";
import { DashboardPage } from "../../pages/DashboardPage";
import { HomePage } from "../../pages/HomePage";

function ProtectedDashboardRoute() {
  const { status } = useAuth();

  if (status !== "authenticated") {
    return <Navigate replace to="/" />;
  }

  return <DashboardPage />;
}

const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/dashboard",
    element: <ProtectedDashboardRoute />
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />
  },
  {
    path: "*",
    element: <Navigate replace to="/" />
  }
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes, {
    basename: appBasePath || undefined
  });
}

export function AppRouter() {
  const [router] = useState(createAppRouter);

  return <RouterProvider router={router} />;
}
