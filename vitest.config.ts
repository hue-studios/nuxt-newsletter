// vitest.config.ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".nuxt/",
        "playground/",
        "test/",
        "*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src/runtime", import.meta.url)),
      "@": fileURLToPath(new URL("./src/runtime", import.meta.url)),
      "#imports": fileURLToPath(
        new URL("./.nuxt/imports.d.ts", import.meta.url)
      ),
    },
  },
});
