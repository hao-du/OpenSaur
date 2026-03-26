import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { applyAccessToken } from "./httpClient";

describe("applyAccessToken", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
  });

  it("adds the bearer token when an authenticated session exists", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "test-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    const config = await applyAccessToken({
      headers: new AxiosHeaders()
    } as InternalAxiosRequestConfig);

    expect(config.headers.get("Authorization")).toBe("Bearer test-access-token");
  });

  it("leaves the request untouched when there is no access token", async () => {
    const config = await applyAccessToken({
      headers: new AxiosHeaders()
    } as InternalAxiosRequestConfig);

    expect(config.headers.has("Authorization")).toBe(false);
  });
});
