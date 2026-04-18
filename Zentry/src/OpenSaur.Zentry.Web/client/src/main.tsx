import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { theme } from "./theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </BrowserRouter>
);
