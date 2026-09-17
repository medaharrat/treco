import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

// Main build: background service worker + popup + dashboard pages.
// The content script is built separately (see vite.content.config.ts) as a
// self-contained IIFE, since manifest-declared content scripts cannot use ES
// module import/export syntax across all supported browsers.
export default defineConfig(({ mode }) => {
  const target = mode === "firefox" ? "firefox" : "chrome";
  const outDir = resolve(__dirname, "dist", target);

  return {
    plugins: [
      react(),
      {
        name: "copy-icons-after-build",
        closeBundle() {
          const iconsSrc = resolve(__dirname, "public", "icons");
          const iconsDest = resolve(outDir, "icons");
          mkdirSync(iconsDest, { recursive: true });
          for (const file of readdirSync(iconsSrc)) {
            copyFileSync(resolve(iconsSrc, file), resolve(iconsDest, file));
          }
        }
      }
    ],
    define: {
      __AIFOOTPRINT_TARGET__: JSON.stringify(target)
    },
    build: {
      outDir,
      emptyOutDir: true,
      target: "es2022",
      // Vite's default modulepreload polyfill calls fetch() to warm the
      // browser's cache for chunk dependencies. Treco has no network
      // requests anywhere else in its code, and does not need this
      // optimization inside an extension page - disabling it means the
      // built bundle contains zero calls to fetch/XHR/WebSocket/etc.
      modulePreload: false,
      rollupOptions: {
        input: {
          background: resolve(__dirname, "src/background/index.ts"),
          popup: resolve(__dirname, "popup.html"),
          dashboard: resolve(__dirname, "dashboard.html")
        },
        output: {
          entryFileNames: (chunk) => (chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js"),
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      }
    }
  };
});
