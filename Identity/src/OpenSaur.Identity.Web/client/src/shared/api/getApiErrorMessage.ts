import { isAxiosError } from "axios";

type ApiError = {
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

  return firstError?.detail
    ?? firstError?.message
    ?? fallbackMessage;
}
