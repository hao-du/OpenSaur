import { useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { appTheme } from "../theme/theme";
import { PreferenceProvider } from "../../features/preferences/PreferenceProvider";

type AppProvidersProps = PropsWithChildren<{
  queryClient?: QueryClient;
}>;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false
      },
      queries: {
        retry: false
      }
    }
  });
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createAppQueryClient());

  return (
    <QueryClientProvider client={client}>
      <PreferenceProvider>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </PreferenceProvider>
    </QueryClientProvider>
  );
}
