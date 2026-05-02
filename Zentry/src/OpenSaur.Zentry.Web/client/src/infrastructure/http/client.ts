import rawAxios, { AxiosHeaders, type AxiosRequestConfig } from "axios";

const axios = rawAxios.create();
let currentAccessToken: string | null = null;
const maxRetryCount = 2;
const baseRetryDelayMs = 400;

export type ClientRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
};

export function setClientAccessToken(accessToken: string | null) {
  currentAccessToken = accessToken;
}

axios.interceptors.request.use((config) => {
  const clientConfig = config as ClientRequestConfig;
  if (clientConfig.skipAuth === true || currentAccessToken == null) {
    return config;
  }

  config.headers = AxiosHeaders.from(config.headers);
  config.headers.set("Authorization", `Bearer ${currentAccessToken}`);

  return config;
});

function shouldRetry(error: unknown) {
  if (!rawAxios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (status != null) {
    return status === 408 || status === 429 || status >= 500;
  }

  return error.code === "ECONNABORTED" || error.message.toLowerCase().includes("network");
}

function getRetryDelayMs(attempt: number) {
  return baseRetryDelayMs * 2 ** attempt;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeWithRetry<TResponse>(request: () => Promise<TResponse>) {
  let attempt = 0;

  while (true) {
    try {
      return await request();
    } catch (error) {
      if (!shouldRetry(error) || attempt >= maxRetryCount) {
        throw error;
      }

      await sleep(getRetryDelayMs(attempt));
      attempt += 1;
    }
  }
}

export const client = {
  get: async <TResponse>(url: string, config?: ClientRequestConfig) => {
    const response = await executeWithRetry(() => axios.get<TResponse>(url, config));
    return response.data;
  },

  post: async <TResponse, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: ClientRequestConfig,
  ) => {
    const response = await executeWithRetry(() => axios.post<TResponse>(url, data, config));
    return response.data;
  },

  put: async <TResponse = void, TRequest = unknown>(
    url: string,
    data?: TRequest,
    config?: ClientRequestConfig,
  ) => {
    const response = await executeWithRetry(() => axios.put<TResponse>(url, data, config));
    return response.data;
  },

  delete: async <TResponse = void>(
    url: string,
    config?: ClientRequestConfig,
  ) => {
    const response = await executeWithRetry(() => axios.delete<TResponse>(url, config));
    return response.data;
  },
};
