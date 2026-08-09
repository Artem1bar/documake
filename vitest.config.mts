import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path alias in tsconfig.json so tests can import
    // application modules the same way the application does.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
