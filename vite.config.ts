import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    entry: ["./src/index.ts", "./src/directives/*.ts"],
    dts: {
      tsgo: true,
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
    environment: "happy-dom",
    setupFiles: ["./tests/vitest.setup.ts"],
  },
});
