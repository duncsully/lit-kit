import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["./src/index.ts", "./src/directives/*.ts"],
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  test: {
    globals: true,
    // We use the navigation API which hasn't been implemented in mock environments
    // at the time of writing, so we enable browser testing instead.
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/config/browser/playwright
      instances: [{ browser: "chromium" }],
    },
  },
});
