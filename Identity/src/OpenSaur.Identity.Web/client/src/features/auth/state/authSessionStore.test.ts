import { beforeEach, describe, expect, it } from "vitest";
import { authSessionStore } from "./authSessionStore";

describe("authSessionStore", () => {
  beforeEach(() => {
    authSessionStore.clearSession();
    sessionStorage.clear();
  });

  it("stores the access token in memory without using browser persistence", () => {
    authSessionStore.setAuthenticatedSession({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z"
    });

    expect(authSessionStore.getSnapshot()).toEqual({
      accessToken: "header.payload.signature",
      expiresAt: "2026-03-28T00:00:00.000Z",
      status: "authenticated"
    });
    expect(sessionStorage.length).toBe(0);
  });

  it("remembers and consumes the pending return url", () => {
    authSessionStore.rememberReturnUrl("/change-password?source=guard");

    expect(authSessionStore.consumeReturnUrl()).toBe("/change-password?source=guard");
    expect(authSessionStore.consumeReturnUrl()).toBeNull();
  });
});
