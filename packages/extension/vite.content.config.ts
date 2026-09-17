import { defineConfig } from "vite";
import { resolve } from "node:path";

// Separate build for the content script: a single self-contained IIFE with
// no external imports, since manifest-declared content_scripts cannot use
// ES module import/export syntax reliably across all supported browsers.
export default defineConfig(({ mode }) => {
  const target = mode === "firefox" ? "firefox" : "chrome";
  const outDir = resolve(__dirname, "dist", target);

  return {
    build: {
      outDir,
      emptyOutDir: false,
      target: "es2022",
      lib: {
        entry: resolve(__dirname, "src/content/index.ts"),
        formats: ["iife"],
        name: "AIFootprintContent",
        fileName: () => "content.js"
      },
      rollupOptions: {
        output: {
          extend: true
        }
      }
    }
  };
});
