import axios from "axios";

export function createApiError(error: unknown, defaultMessage: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (typeof status === "number") {
      return new Error(`${defaultMessage} with status ${status}.`);
    }

    return new Error(defaultMessage);
  }

  if (error instanceof Error && error.message.length > 0) {
    return error;
  }

  return new Error(defaultMessage);
}
