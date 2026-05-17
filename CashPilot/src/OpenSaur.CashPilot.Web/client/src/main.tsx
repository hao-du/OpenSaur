import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { theme } from "./infrastructure/theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthSessionProvider } from "./features/auth/hooks/AuthContext";
import { SettingProvider } from "./features/settings/provider/SettingProvider";
import "./infrastructure/styles/transactionType.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <AuthSessionProvider>
                        <SettingProvider>
                            <App />
                        </SettingProvider>
                    </AuthSessionProvider>
                </LocalizationProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </BrowserRouter>
);
