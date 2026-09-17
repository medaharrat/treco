import type { UsageEventCandidate } from "@ai-footprint/core";
import { browser } from "./browserApi.js";

export const MESSAGE_TYPE_USAGE_CANDIDATE = "aifootprint/usage-candidate" as const;

export interface UsageCandidateMessage {
  type: typeof MESSAGE_TYPE_USAGE_CANDIDATE;
  payload: UsageEventCandidate;
}

export function isUsageCandidateMessage(msg: unknown): msg is UsageCandidateMessage {
  return typeof msg === "object" && msg !== null && (msg as { type?: unknown }).type === MESSAGE_TYPE_USAGE_CANDIDATE;
}

export async function sendUsageCandidate(payload: UsageEventCandidate): Promise<void> {
  try {
    await browser.runtime.sendMessage({ type: MESSAGE_TYPE_USAGE_CANDIDATE, payload } satisfies UsageCandidateMessage);
  } catch {
    // The background service worker may be momentarily asleep/restarting;
    // dropping an occasional usage sample is preferable to throwing inside
    // a MutationObserver callback on someone else's page.
  }
}
