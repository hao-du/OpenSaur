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
import { OfflineTransactionsPage } from "./features/offline/pages/OfflineTransactionsPage";
import { PendingTransactionsPage } from "./features/pending/pages/PendingTransactionsPage";
import ReportsPage from "./features/reports/pages/ReportsPage";
import { isOfflineMode } from "./infrastructure/config/buildMode";
export function App() {
    const { authSession, isRestoring } = useAuthSession();
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    if (isOfflineMode()) {
        return (
            <Routes>
                <Route element={<Outlet />}>
                    <Route
                        element={<Navigate replace to="/offline/transactions" />}
                        path="/"
                    />
                    <Route
                        element={<OfflineTransactionsPage />}
                        path="/offline/transactions"
                    />
                    <Route
                        element={<Navigate replace to="/offline/transactions?importMetadata=1" />}
                        path="/offline/import"
                    />
                    <Route
                        element={<Navigate replace to="/offline/transactions" />}
                        path="*"
                    />
                </Route>
                <Route
                    element={<PrepareSessionPage isRestoring={isRestoring} />}
                    path="/prepare-session"
                />
                <Route
                    element={<AuthCallbackPage />}
                    path="/auth/callback"
                />
            </Routes>
        );
    }

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
                    element={<PendingTransactionsPage />}
                    path="/pending-transactions"
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
                    element={<ReportsPage />}
                    path="/reports"
                />
                <Route
                    element={<SettingsPage />}
                    path="/profile"
                />
                <Route
                    element={<Navigate replace to="/pending-transactions" />}
                    path="/offline/import"
                />
                <Route
                    element={<Navigate replace to="/pending-transactions" />}
                    path="/offline/transactions"
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


