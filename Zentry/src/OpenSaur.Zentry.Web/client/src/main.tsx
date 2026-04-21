import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { theme } from "./infrastructure/theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthSessionProvider } from "./features/auth/hooks/AuthContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthSessionProvider>
                    <App />
                </AuthSessionProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </BrowserRouter>
);
