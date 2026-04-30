import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import type { SettingsDto } from "../dtos/SettingsDto";
import { detectBrowserTimeZone, getSupportedTimeZones } from "../services/timeZones";
import { translations, type AppLocale, type TranslationKey } from "./translations";
import { useSettingsQuery } from "../hooks/useSettingsQuery";

export type AppSettings = {
  locale: AppLocale;
  timeZone: string;
};

type SettingContextValue = {
  applyServerSettings: (settings: SettingsDto) => void;
  formatDateTime: (value: Date | string | number | null | undefined) => string;
  locale: AppLocale;
  setSettings: (settings: AppSettings) => void;
  settings: AppSettings;
  supportedTimeZones: string[];
  t: (key: TranslationKey) => string;
  timeZone: string;
};

const settingsStorageKey = "opensaur.zentry.settings";
const SettingContext = createContext<SettingContextValue | null>(null);

function normalizeLocale(locale: string | null | undefined): AppLocale | null {
  return locale === "en" || locale === "vi" ? locale : null;
}

function loadSettingsFromLocalStorage(): AppSettings {
  const fallbackSettings = {
    locale: "en",
    timeZone: detectBrowserTimeZone()
  } satisfies AppSettings;

  if (typeof window === "undefined") {
    return fallbackSettings;
  }

  const rawSettings = window.localStorage.getItem(settingsStorageKey);
  if (!rawSettings) {
    return fallbackSettings;
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as Partial<AppSettings>;

    return {
      locale: normalizeLocale(parsedSettings.locale) ?? fallbackSettings.locale,
      timeZone: typeof parsedSettings.timeZone === "string" && parsedSettings.timeZone.trim()
        ? parsedSettings.timeZone
        : fallbackSettings.timeZone
    };
  } catch {
    return fallbackSettings;
  }
}

function persistSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

export function SettingProvider({ children }: PropsWithChildren) {
  const { authSession } = useAuthSession();
  const [settings, setSettingState] = useState(loadSettingsFromLocalStorage);
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const { data: savedSettings } = useSettingsQuery(authSession != null);

  const setSettings = useCallback((nextSettings: AppSettings) => {
    setSettingState(nextSettings);
    persistSettings(nextSettings);
  }, []);

  const applyServerSettings = useCallback((serverSettings: SettingsDto) => {
    setSettingState(currentSettings => {
      const nextSettings = {
        locale: normalizeLocale(serverSettings.locale) ?? currentSettings.locale,
        timeZone: serverSettings.timeZone && serverSettings.timeZone.trim()
          ? serverSettings.timeZone
          : currentSettings.timeZone
      };

      persistSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  useEffect(() => {
    if (savedSettings == null) {
      return;
    }

    applyServerSettings(savedSettings);
  }, [applyServerSettings, savedSettings]);

  const t = useCallback((key: TranslationKey) => {
    return translations[settings.locale][key] ?? translations.en[key];
  }, [settings.locale]);

  const formatDateTime = useCallback((value: Date | string | number | null | undefined) => {
    if (value == null || value === "") {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const locale = settings.locale === "vi" ? "vi-VN" : "en-US";

    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      timeZone: settings.timeZone,
      timeZoneName: "short",
      year: "numeric"
    }).format(date);
  }, [settings.locale, settings.timeZone]);

  const value = useMemo<SettingContextValue>(() => ({
    applyServerSettings,
    formatDateTime,
    locale: settings.locale,
    setSettings,
    settings,
    supportedTimeZones,
    t,
    timeZone: settings.timeZone
  }), [applyServerSettings, formatDateTime, settings, setSettings, supportedTimeZones, t]);

  return (
    <SettingContext.Provider value={value}>
      {children}
    </SettingContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingContext);
  if (context == null) {
    throw new Error("useSettings must be used within SettingProvider.");
  }

  return context;
}
