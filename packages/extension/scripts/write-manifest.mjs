// Generates manifest.json into dist/ after the Vite build, deriving
// host_permissions/content_scripts matches from the core provider registry
// so the manifest can never drift out of sync with the adapters.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const target = process.argv[2] ?? "chrome";
const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist", target);
const corePath = join(__dirname, "..", "..", "core", "dist", "index.js");

if (!existsSync(corePath)) {
  console.error(`Core package not built yet. Run "npm run build -w @ai-footprint/core" first.`);
  process.exit(1);
}

const { PROVIDER_REGISTRY } = await import(corePath);

const domains = PROVIDER_REGISTRY.flatMap((p) => p.domains);
const matches = domains.map((d) => `*://${d}/*`);
const hostPermissions = matches;

const base = {
  manifest_version: 3,
  name: "Treco",
  short_name: "Treco",
  version: "0.1.0",
  description:
    "See your AI usage and its estimated energy, CO2e and water footprint - entirely on your device. No conversations collected, ever.",
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png"
  },
  action: {
    default_popup: "popup.html",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png"
    },
    default_title: "Treco"
  },
  // Only what's actually used: local storage for usage data/settings. No
  // "just in case" permissions - e.g. no `alarms`, since nothing schedules
  // anything, and no `notifications`, since there is no notification feature.
  permissions: ["storage"],
  host_permissions: hostPermissions,
  // Explicit, not just relying on the MV3 default: no remote code, no inline
  // script execution, nothing but the extension's own bundled scripts.
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  content_scripts: [
    {
      matches,
      js: ["content.js"],
      run_at: "document_idle",
      all_frames: false
    }
  ],
  options_ui: {
    page: "dashboard.html#/settings",
    open_in_tab: true
  }
};

const manifest =
  target === "firefox"
    ? {
        ...base,
        background: { scripts: ["background.js"], type: "module" },
        browser_specific_settings: {
          gecko: {
            id: "ai-footprint@example.invalid",
            strict_min_version: "115.0"
          }
        }
      }
    : {
        ...base,
        background: { service_worker: "background.js", type: "module" }
      };

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${target} manifest with ${matches.length} host permissions/content script matches.`);
