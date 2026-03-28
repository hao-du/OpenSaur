import { describe, expect, it } from "vitest";
import { normalizeAuthReturnUrl } from "./normalizeAuthReturnUrl";

describe("normalizeAuthReturnUrl", () => {
  it("keeps protected shell routes", () => {
    expect(normalizeAuthReturnUrl("/users?tab=active#top")).toBe("/users?tab=active#top");
  });

  it("falls back when the return url is a public auth route", () => {
    expect(normalizeAuthReturnUrl("/change-password")).toBe("/");
    expect(normalizeAuthReturnUrl("/login?returnUrl=%2Fusers")).toBe("/");
    expect(normalizeAuthReturnUrl("/auth/callback?code=test")).toBe("/");
  });

  it("falls back when the return url is missing or invalid", () => {
    expect(normalizeAuthReturnUrl(null)).toBe("/");
    expect(normalizeAuthReturnUrl("https://example.com")).toBe("/");
    expect(normalizeAuthReturnUrl("users")).toBe("/");
  });
});
