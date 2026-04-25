import rawAxios, { AxiosHeaders, type AxiosRequestConfig } from "axios";
import { getAuthSession } from "../../features/auth/storages/authStorage";

const axios = rawAxios.create();

axios.interceptors.request.use((config) => {
  const authSession = getAuthSession();
  if (authSession == null) {
    return config;
  }

  config.headers = AxiosHeaders.from(config.headers);
  config.headers.set("Authorization", `Bearer ${authSession.accessToken}`);

  return config;
});

export { axios };

export async function get<TResponse>(url: string, config?: AxiosRequestConfig) {
  const response = await axios.get<TResponse>(url, config);
  return response.data;
}

export async function post<TResponse, TRequest = unknown>(
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig
) {
  const response = await axios.post<TResponse>(url, data, config);
  return response.data;
}

export async function put<TResponse = void, TRequest = unknown>(
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig
) {
  const response = await axios.put<TResponse>(url, data, config);
  return response.data;
}

export async function deleteRequest<TResponse = void>(url: string, config?: AxiosRequestConfig) {
  const response = await axios.delete<TResponse>(url, config);
  return response.data;
}
