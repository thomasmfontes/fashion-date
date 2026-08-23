import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/rendered-html.test.mjs", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        "tests/**",
        "scripts/**",
        "*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@/db/runtime": resolve(__dirname, "./tests/mocks/cloudflare-workers.ts"),
      "@": resolve(__dirname, "./"),
      "cloudflare:workers": resolve(__dirname, "./tests/mocks/cloudflare-workers.ts"),
    },
  },
});
