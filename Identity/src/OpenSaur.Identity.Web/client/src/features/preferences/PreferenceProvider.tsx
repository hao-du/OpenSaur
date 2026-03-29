import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { CurrentUserSettingsResponse } from "../auth/api/authApi";
import { i18n } from "../localization/i18n";
import type { TranslationKey } from "../localization/resources";
import { getLanguageTag, type AppLanguageTag } from "./locale";
import { detectBrowserTimeZone, getSupportedTimeZones } from "./timeZones";
import type { AppLocale, AppPreferences } from "./types";

export const preferenceStorageKey = "opensaur.identity.preferences";

type PreferenceContextValue = {
  applyServerSettings: (settings: CurrentUserSettingsResponse) => void;
  languageTag: AppLanguageTag;
  locale: AppLocale;
  preferences: AppPreferences;
  setPreferences: (preferences: AppPreferences) => void;
  supportedTimeZones: string[];
  t: (key: TranslationKey, options?: Record<string, unknown>) => string;
  timeZone: string;
};

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

function normalizeLocale(locale: string | null | undefined): AppLocale | null {
  return locale === "en" || locale === "vi"
    ? locale
    : null;
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage as Partial<Storage> | undefined;
  return storage
    && typeof storage.getItem === "function"
    && typeof storage.setItem === "function"
    && typeof storage.removeItem === "function"
    && typeof storage.clear === "function"
      ? storage as Storage
      : null;
}

function loadPreferencesFromLocalStorage(): AppPreferences {
  const storage = getLocalStorage();
  if (!storage) {
    return {
      locale: "en",
      timeZone: "UTC"
    };
  }

  const rawPreferences = storage.getItem(preferenceStorageKey);
  if (!rawPreferences) {
    return {
      locale: "en",
      timeZone: detectBrowserTimeZone()
    };
  }

  try {
    const parsedPreferences = JSON.parse(rawPreferences) as Partial<AppPreferences>;

    return {
      locale: normalizeLocale(parsedPreferences.locale) ?? "en",
      timeZone: typeof parsedPreferences.timeZone === "string" && parsedPreferences.timeZone.trim()
        ? parsedPreferences.timeZone
        : detectBrowserTimeZone()
    };
  } catch {
    return {
      locale: "en",
      timeZone: detectBrowserTimeZone()
    };
  }
}

function persistPreferences(preferences: AppPreferences) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(preferenceStorageKey, JSON.stringify(preferences));
}

export function PreferenceProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferenceState] = useState(loadPreferencesFromLocalStorage);
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const languageTag = getLanguageTag(preferences.locale);
  const fixedT = useMemo(() => i18n.getFixedT(languageTag), [languageTag]);

  const setPreferences = useCallback((nextPreferences: AppPreferences) => {
    setPreferenceState(nextPreferences);
    persistPreferences(nextPreferences);
  }, []);

  const applyServerSettings = useCallback((settings: CurrentUserSettingsResponse) => {
    setPreferenceState(currentPreferences => {
      const nextPreferences = {
        locale: normalizeLocale(settings.locale) ?? currentPreferences.locale,
        timeZone: settings.timeZone && settings.timeZone.trim()
          ? settings.timeZone
          : currentPreferences.timeZone
      };

      persistPreferences(nextPreferences);

      return nextPreferences;
    });
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(languageTag);
  }, [languageTag]);

  const value = useMemo<PreferenceContextValue>(() => ({
    applyServerSettings,
    languageTag,
    locale: preferences.locale,
    preferences,
    setPreferences,
    supportedTimeZones,
    t: (key: TranslationKey, options?: Record<string, unknown>) => fixedT(key, options),
    timeZone: preferences.timeZone
  }), [applyServerSettings, fixedT, languageTag, preferences, setPreferences, supportedTimeZones]);

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferenceProvider.");
  }

  return context;
}
