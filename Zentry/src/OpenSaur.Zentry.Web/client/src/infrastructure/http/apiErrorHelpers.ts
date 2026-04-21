import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data;
  if (responseData != null && typeof responseData === "object") {
    const details = responseData as {
      detail?: string;
      errors?: Record<string, string[] | undefined>;
      title?: string;
    };

    if (typeof details.detail === "string" && details.detail.length > 0) {
      return details.detail;
    }

    if (details.errors != null) {
      const validationMessages = Object.values(details.errors)
        .flatMap(value => value ?? [])
        .filter(message => message.length > 0);

      if (validationMessages.length > 0) {
        return validationMessages[0];
      }
    }

    if (typeof details.title === "string" && details.title.length > 0) {
      return details.title;
    }
  }

  if (typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

export function isApiErrorStatus(error: unknown, statusCode: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === statusCode;
}
