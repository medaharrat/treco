import { buildUsageEvent, validateUsageEventCandidate } from "@ai-footprint/core";
import { browser } from "../platform/browserApi.js";
import { WebExtensionStorageAdapter } from "../platform/storage.js";
import { isUsageCandidateMessage } from "../platform/messaging.js";

const storage = new WebExtensionStorageAdapter();

/**
 * Background service worker: the single trust boundary for turning
 * page-observed data into stored UsageEvents. Every incoming message is
 * independently re-validated here (never trusting the sender), and
 * environmental figures are always recomputed from the validated token
 * counts rather than accepted from the content script.
 */
browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isUsageCandidateMessage(message)) {
    return undefined;
  }

  return handleUsageCandidate(message.payload)
    .then(() => ({ ok: true }))
    .catch((error: unknown) => {
      console.warn("[ai-footprint] failed to record usage event", error);
      return { ok: false };
    });
});

async function handleUsageCandidate(rawPayload: unknown): Promise<void> {
  const validated = validateUsageEventCandidate(rawPayload);
  if (!validated.ok) {
    console.warn("[ai-footprint] rejected usage candidate:", validated.reason);
    return;
  }

  const settings = await storage.getSettings();
  if (!settings.enabledProviders.includes(validated.value.provider)) {
    return; // user has this provider disabled; do not record
  }

  const event = buildUsageEvent(validated.value, {
    carbonIntensityOverrideGPerKwh: settings.carbonIntensityOverrideGPerKwh ?? undefined
  });

  await storage.addEvent(event);
}

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    const dashboardUrl = browser.runtime.getURL("dashboard.html#/onboarding");
    void browser.tabs.create({ url: dashboardUrl });
  }
});
