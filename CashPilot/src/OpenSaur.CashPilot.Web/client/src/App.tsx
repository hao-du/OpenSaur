import { Outlet, Route, Routes } from "react-router-dom";
import { ForbiddenPage } from "./features/auth/pages/ForbiddenPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { BanksPage } from "./features/banks/pages/BanksPage";
import { CounterpartiesPage } from "./features/counterparties/pages/CounterpartiesPage";
import { CurrenciesPage } from "./features/currencies/pages/CurrenciesPage";
import { TransactionsPage } from "./features/transactions/pages/TransactionsPage";
import { TemplatesPage } from "./features/templates/pages/TemplatesPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { TagsPage } from "./features/tags/pages/TagsPage";
import ReportsPage from "./features/reports/pages/ReportsPage";
import { PrepareSessionPage } from "./features/auth/pages/PrepareSessionPage";

export function App() {
    const { isAuthenticated, isLoading } = useAuth({ autoRedirect: true });

    if (isLoading || !isAuthenticated) {
        return <PrepareSessionPage />;
    }

    return (
        <Routes>
            <Route element={<Outlet />}>
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
                    element={<ReportsPage />}
                    path="/reports"
                />
                <Route
                    element={<SettingsPage />}
                    path="/profile"
                />
            </Route>
        </Routes>
    );
}
