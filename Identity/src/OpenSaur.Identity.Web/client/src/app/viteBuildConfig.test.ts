// @vitest-environment node
import { describe, expect, it } from "vitest";
import viteConfig from "../../vite.config.ts";

function resolveConfigForMode(mode: string) {
  const configFactory = viteConfig as unknown as ((environment: {
    command: "build";
    isPreview: boolean;
    isSsrBuild: boolean;
    mode: string;
  }) => {
    build?: {
      sourcemap?: boolean;
    };
  }) | {
    build?: {
      sourcemap?: boolean;
    };
  };

  if (typeof configFactory !== "function") {
    return configFactory;
  }

  return configFactory({
    command: "build",
    isPreview: false,
    isSsrBuild: false,
    mode
  });
}

describe("vite build configuration", () => {
  it("enables sourcemaps for development builds", () => {
    const config = resolveConfigForMode("development");

    expect(config.build?.sourcemap).toBe(true);
  });

  it("keeps sourcemaps disabled for production builds", () => {
    const config = resolveConfigForMode("production");

    expect(config.build?.sourcemap).toBe(false);
  });
});
