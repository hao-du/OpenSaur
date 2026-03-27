import { describe, expect, it } from "vitest";
import { publicAuthRoutes } from "./publicAuthRoutes";

describe("publicAuthRoutes", () => {
  it("lists the public auth pages", () => {
    expect(publicAuthRoutes).toEqual([
      "/login",
      "/auth/callback"
    ]);
  });
});
