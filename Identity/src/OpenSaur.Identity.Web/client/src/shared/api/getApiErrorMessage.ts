import { isAxiosError } from "axios";
import { i18n } from "../../features/localization/i18n";

type ApiError = {
  code?: string;
  detail?: string;
  message?: string;
};

type ApiEnvelope = {
  errors?: ApiError[];
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!isAxiosError<ApiEnvelope>(error)) {
    return fallbackMessage;
  }

  const firstError = error.response?.data?.errors?.[0];
  const translatedCode = firstError?.code ? `apiErrors.${firstError.code}` : null;

  if (translatedCode && i18n.exists(translatedCode)) {
    return i18n.t(translatedCode);
  }

  return firstError?.detail
    ?? firstError?.message
    ?? fallbackMessage;
}
