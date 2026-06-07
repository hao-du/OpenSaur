import type { ReactNode } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSettings } from "../../features/settings/provider/SettingProvider";

type Props = {
  children: ReactNode;
};

export function AppLocalizationProvider({ children }: Props) {
  const { locale } = useSettings();
  const adapterLocale = locale === "vi" ? "vi" : "en";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
      {children}
    </LocalizationProvider>
  );
}
