import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { theme } from "./infrastructure/theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthSessionProvider } from "./features/auth/hooks/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthSessionProvider>
                <App />
            </AuthSessionProvider>
        </ThemeProvider>
    </BrowserRouter>
);
