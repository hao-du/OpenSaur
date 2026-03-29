import type { Localization } from "@mui/material/locale";
import { enUS, viVN } from "@mui/material/locale";
import type { AppLocale } from "./types";

export type AppLanguageTag = "en-US" | "vi-VN";

export function getLanguageTag(locale: AppLocale): AppLanguageTag {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function getMuiLocalization(locale: AppLocale): Localization {
  return locale === "vi" ? viVN : enUS;
}
