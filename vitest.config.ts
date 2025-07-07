import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src/runtime", import.meta.url)),
      "@": fileURLToPath(new URL("./src/runtime", import.meta.url)),
    },
  },
});
