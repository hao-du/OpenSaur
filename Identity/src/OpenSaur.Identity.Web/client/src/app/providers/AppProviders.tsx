import { useMemo, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { IntlProvider } from "react-intl";
import { I18nextProvider } from "react-i18next";
import { createAppTheme } from "../theme/theme";
import { i18n } from "../../features/localization/i18n";
import { PreferenceProvider } from "../../features/preferences/PreferenceProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { getLanguageTag, getMuiLocalization } from "../../features/preferences/locale";

const defaultQueryStaleTimeInMilliseconds = 5 * 60 * 1000;

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
        retry: false,
        staleTime: defaultQueryStaleTimeInMilliseconds,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      }
    }
  });
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createAppQueryClient());

  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PreferenceProvider>
          <LocalizedProviders>
            {children}
          </LocalizedProviders>
        </PreferenceProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function LocalizedProviders({ children }: PropsWithChildren) {
  const { locale, timeZone } = usePreferences();
  const languageTag = getLanguageTag(locale);
  const theme = useMemo(() => createAppTheme(getMuiLocalization(locale)), [locale]);

  return (
    <IntlProvider
      locale={languageTag}
      messages={{}}
      timeZone={timeZone}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </IntlProvider>
  );
}
