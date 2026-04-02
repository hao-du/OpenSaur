import axios, { type InternalAxiosRequestConfig } from "axios";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { appBasePath } from "../config/appBasePath";

export type OpenSaurRequestConfig = InternalAxiosRequestConfig & {
  idempotent?: boolean;
};

export async function applyRequestPolicies(config: OpenSaurRequestConfig) {
  if (config.idempotent) {
    config.headers.set("Idempotency-Key", crypto.randomUUID());
  }

  const accessToken = authSessionStore.getAccessToken();
  if (!accessToken) {
    return config;
  }

  config.headers.set("Authorization", `Bearer ${accessToken}`);

  return config;
}

export const httpClient = axios.create({
  baseURL: appBasePath || undefined,
  withCredentials: true
});

httpClient.interceptors.request.use(applyRequestPolicies);
