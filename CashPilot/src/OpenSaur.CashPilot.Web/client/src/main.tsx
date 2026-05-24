import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { theme } from "./infrastructure/theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthSessionProvider } from "./features/auth/hooks/AuthContext";
import { SettingProvider, useSettings } from "./features/settings/provider/SettingProvider";
import "./infrastructure/styles/transactionType.css";
import "dayjs/locale/vi";
import "dayjs/locale/en";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

function AppLocalizationProvider({ children }: { children: React.ReactNode }) {
    const { locale } = useSettings();
    const adapterLocale = locale === "vi" ? "vi" : "en";

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
            {children}
        </LocalizationProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthSessionProvider>
                    <SettingProvider>
                        <AppLocalizationProvider>
                            <App />
                        </AppLocalizationProvider>
                    </SettingProvider>
                </AuthSessionProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </BrowserRouter>
);
