import axios, { type InternalAxiosRequestConfig } from "axios";
import { authSessionStore } from "../../features/auth/state/authSessionStore";

export async function applyAccessToken(config: InternalAxiosRequestConfig) {
  const accessToken = authSessionStore.getAccessToken();
  if (!accessToken) {
    return config;
  }

  config.headers.set("Authorization", `Bearer ${accessToken}`);

  return config;
}

export const httpClient = axios.create({
  withCredentials: true
});

httpClient.interceptors.request.use(applyAccessToken);
