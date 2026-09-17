import { buildUsageEvent, getProviderByDomain, validateUsageEventCandidate } from "@ai-footprint/core";
import type { Runtime } from "../platform/browserApi.js";
import { browser } from "../platform/browserApi.js";
import { WebExtensionStorageAdapter } from "../platform/storage.js";
import { isUsageCandidateMessage } from "../platform/messaging.js";

const storage = new WebExtensionStorageAdapter();

/**
 * Background service worker: the single trust boundary for turning
 * page-observed data into stored UsageEvents. Every incoming message is
 * independently re-validated here (never trusting the sender): the payload
 * shape/ranges are re-checked against the strict schema, the message's
 * claimed provider id must match the actual domain the message came from
 * (so a bug or a compromised page can't misattribute usage to a different
 * provider), and environmental figures are always recomputed from the
 * validated token counts rather than accepted from the content script.
 */
browser.runtime.onMessage.addListener((message: unknown, sender: Runtime.MessageSender) => {
  if (!isUsageCandidateMessage(message)) {
    return undefined;
  }

  return handleUsageCandidate(message.payload, sender)
    .then(() => ({ ok: true }))
    .catch((error: unknown) => {
      console.warn("[treco] failed to record usage event", error);
      return { ok: false };
    });
});

function senderHostname(sender: Runtime.MessageSender): string | null {
  const url = sender.url ?? sender.tab?.url;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function handleUsageCandidate(rawPayload: unknown, sender: Runtime.MessageSender): Promise<void> {
  const validated = validateUsageEventCandidate(rawPayload);
  if (!validated.ok) {
    console.warn("[treco] rejected usage candidate:", validated.reason);
    return;
  }

  const hostname = senderHostname(sender);
  const domainProvider = hostname ? getProviderByDomain(hostname) : undefined;
  if (!domainProvider || domainProvider.id !== validated.value.provider) {
    console.warn("[treco] rejected usage candidate: sender domain does not match claimed provider");
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
