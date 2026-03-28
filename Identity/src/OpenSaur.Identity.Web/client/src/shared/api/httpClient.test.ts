import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { authSessionStore } from "../../features/auth/state/authSessionStore";
import { applyRequestPolicies } from "./httpClient";

describe("applyRequestPolicies", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
  });

  it("adds the bearer token when an authenticated session exists", async () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "test-access-token",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    const config = await applyRequestPolicies({
      headers: new AxiosHeaders()
    } as InternalAxiosRequestConfig);

    expect(config.headers.get("Authorization")).toBe("Bearer test-access-token");
  });

  it("adds an idempotency key when the request opts in", async () => {
    const config = await applyRequestPolicies({
      headers: new AxiosHeaders(),
      idempotent: true
    } as InternalAxiosRequestConfig & { idempotent: boolean; });

    expect(config.headers.get("Idempotency-Key")).toBeTypeOf("string");
  });

  it("does not add an idempotency key when the request does not opt in", async () => {
    const config = await applyRequestPolicies({
      headers: new AxiosHeaders()
    } as InternalAxiosRequestConfig);

    expect(config.headers.has("Idempotency-Key")).toBe(false);
    expect(config.headers.has("Authorization")).toBe(false);
  });
});
