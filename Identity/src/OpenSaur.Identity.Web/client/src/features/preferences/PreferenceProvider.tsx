import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { CurrentUserSettingsResponse } from "../auth/api/authApi";
import { preferenceMessages, type PreferenceMessageKey } from "./messages";
import { detectBrowserTimeZone, getSupportedTimeZones } from "./timeZones";
import type { AppLocale, AppPreferences } from "./types";

export const preferenceStorageKey = "opensaur.identity.preferences";

type PreferenceContextValue = {
  applyServerSettings: (settings: CurrentUserSettingsResponse) => void;
  locale: AppLocale;
  preferences: AppPreferences;
  setPreferences: (preferences: AppPreferences) => void;
  supportedTimeZones: string[];
  t: (key: PreferenceMessageKey) => string;
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

  const value = useMemo<PreferenceContextValue>(() => ({
    applyServerSettings,
    locale: preferences.locale,
    preferences,
    setPreferences,
    supportedTimeZones,
    t: (key: PreferenceMessageKey) => preferenceMessages[preferences.locale][key] ?? preferenceMessages.en[key],
    timeZone: preferences.timeZone
  }), [applyServerSettings, preferences, setPreferences, supportedTimeZones]);

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
