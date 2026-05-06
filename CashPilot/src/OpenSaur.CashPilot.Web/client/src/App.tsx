import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { ForbiddenPage } from "./features/auth/pages/ForbiddenPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";
import { useAuthSession } from "./features/auth/hooks/AuthContext";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { BanksPage } from "./features/banks/pages/BanksPage";
export function App() {
    const { authSession, isRestoring } = useAuthSession();

    return (
        <Routes>
            <Route element={isRestoring || authSession == null ? <Navigate replace to="/prepare-session" /> : <Outlet />}>
                <Route
                    element={<DashboardPage />}
                    path="/"
                />
                <Route
                    element={<ForbiddenPage />}
                    path="/forbidden"
                />
                <Route
                    element={<BanksPage />}
                    path="/banks"
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
