import { describe, expect, it } from "vitest";
import { createAppQueryClient } from "./AppProviders";

describe("createAppQueryClient", () => {
  it("configures global query caching defaults", () => {
    const queryClient = createAppQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.retry).toBe(false);
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(false);
  });
});
