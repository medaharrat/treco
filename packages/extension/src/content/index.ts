import { DEFAULT_SETTINGS, type ExtensionSettings, type UsageEvent } from "@ai-footprint/core";
import { findAdapterForCurrentPage } from "../adapters/registry.js";
import { sendUsageCandidate } from "../platform/messaging.js";
import { browser } from "../platform/browserApi.js";

/**
 * Content script entry point. Runs in an isolated world on every supported
 * provider domain (see manifest content_scripts). It never touches
 * chrome.storage directly - all persistence happens in the background
 * service worker, which re-validates and re-derives environmental figures
 * itself rather than trusting numbers computed here.
 */
async function main() {
  const adapter = findAdapterForCurrentPage();
  if (!adapter) return;

  const settings = await readSettings();
  if (!settings.enabledProviders.includes(adapter.id)) return;

  adapter.observe((event: UsageEvent | null) => {
    if (!event) return;
    void sendUsageCandidate({
      provider: event.provider,
      model: event.model,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      tokenMethod: event.tokenMethod,
      timestamp: event.timestamp
    });
  });

  window.addEventListener("pagehide", () => adapter.disconnect(), { once: true });
}

async function readSettings(): Promise<ExtensionSettings> {
  try {
    const result = await browser.storage.local.get("aifootprint:settings");
    const stored = result["aifootprint:settings"] as Partial<ExtensionSettings> | undefined;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

main();
