import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { ForbiddenPage } from "./features/auth/pages/ForbiddenPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";
import { useAuthSession } from "./features/auth/hooks/AuthContext";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { BanksPage } from "./features/banks/pages/BanksPage";
import { CounterpartiesPage } from "./features/counterparties/pages/CounterpartiesPage";
import { CurrenciesPage } from "./features/currencies/pages/CurrenciesPage";
import { TransactionsPage } from "./features/transactions/pages/TransactionsPage";
import { TemplatesPage } from "./features/templates/pages/TemplatesPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { TagsPage } from "./features/tags/pages/TagsPage";
export function App() {
    const { authSession, isRestoring } = useAuthSession();
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}${location.hash}`;

    return (
        <Routes>
            <Route element={isRestoring || authSession == null ? <Navigate replace state={{ returnTo }} to="/prepare-session" /> : <Outlet />}>
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
                <Route
                    element={<CounterpartiesPage />}
                    path="/counterparties"
                />
                <Route
                    element={<CurrenciesPage />}
                    path="/currencies"
                />
                <Route
                    element={<TransactionsPage />}
                    path="/transactions"
                />
                <Route
                    element={<SettingsPage />}
                    path="/settings"
                />
                <Route
                    element={<TemplatesPage />}
                    path="/templates"
                />
                <Route
                    element={<TagsPage />}
                    path="/tags"
                />
                <Route
                    element={<SettingsPage />}
                    path="/profile"
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


