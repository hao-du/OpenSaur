import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthSessionProvider } from "./features/auth/hooks/AuthContext";
import { SettingProvider } from "./features/settings/provider/SettingProvider";
import { AppLocalizationProvider } from "./components/providers/AppLocalizationProvider";
import { theme } from "./infrastructure/theme/theme";
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
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
