import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["convex/**", "edge-runtime"], // Convex functions
      ["**", "node"]                 // anything else
    ],
    server: {
      deps: { inline: ["convex-test"] }
    }
  }
});
