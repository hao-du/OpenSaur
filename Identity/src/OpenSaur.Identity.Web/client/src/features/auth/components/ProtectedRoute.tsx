import type { PropsWithChildren } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authSessionStore } from "../state/authSessionStore";
import { useAuthSession } from "../state/useAuthSession";

function buildReturnUrl(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const session = useAuthSession();

  if (session.status !== "authenticated") {
    const returnUrl = buildReturnUrl(location);
    authSessionStore.rememberReturnUrl(returnUrl);

    return (
      <Navigate
        replace
        to={`/auth-required?returnUrl=${encodeURIComponent(returnUrl)}`}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
