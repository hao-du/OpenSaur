import { CssBaseline, ThemeProvider } from "@mui/material";
import { DefaultLayout } from "./components/layouts/DefaultLayout";
import { theme } from "./theme/theme";

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DefaultLayout
        subtitle="Static shell copied from the Identity workspace structure. No authentication or feature wiring is enabled yet."
        title="Dashboard"
      >
        <p>Workspace content will be added step by step.</p>
      </DefaultLayout>
    </ThemeProvider>
  );
}
