import {
  DEFAULT_SETTINGS,
  MAX_STORED_EVENTS,
  assertPrivacySafe,
  type ExtensionSettings,
  type Goal,
  type StorageAdapter,
  type UsageEvent
} from "@ai-footprint/core";
import { browser } from "./browserApi.js";

const KEYS = {
  events: "aifootprint:events",
  settings: "aifootprint:settings",
  goals: "aifootprint:goals"
} as const;

/**
 * browser.storage.local-backed implementation of the core StorageAdapter
 * contract. All events are validated with assertPrivacySafe before being
 * written, so even a future bug elsewhere cannot silently persist raw text.
 */
export class WebExtensionStorageAdapter implements StorageAdapter {
  async getEvents(): Promise<UsageEvent[]> {
    const result = await browser.storage.local.get(KEYS.events);
    const events = result[KEYS.events];
    return Array.isArray(events) ? (events as UsageEvent[]) : [];
  }

  async addEvent(event: UsageEvent): Promise<void> {
    assertPrivacySafe(event);
    const events = await this.getEvents();
    events.push(event);
    const trimmed = events.length > MAX_STORED_EVENTS ? events.slice(events.length - MAX_STORED_EVENTS) : events;
    await browser.storage.local.set({ [KEYS.events]: trimmed });
  }

  async replaceAllEvents(events: UsageEvent[]): Promise<void> {
    for (const e of events) assertPrivacySafe(e);
    const trimmed = events.slice(-MAX_STORED_EVENTS);
    await browser.storage.local.set({ [KEYS.events]: trimmed });
  }

  async clearAllEvents(): Promise<void> {
    await browser.storage.local.remove(KEYS.events);
  }

  async getSettings(): Promise<ExtensionSettings> {
    const result = await browser.storage.local.get(KEYS.settings);
    const stored = result[KEYS.settings] as Partial<ExtensionSettings> | undefined;
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async setSettings(settings: ExtensionSettings): Promise<void> {
    await browser.storage.local.set({ [KEYS.settings]: settings });
  }

  async getGoals(): Promise<Goal[]> {
    const result = await browser.storage.local.get(KEYS.goals);
    const goals = result[KEYS.goals];
    return Array.isArray(goals) ? (goals as Goal[]) : [];
  }

  async setGoals(goals: Goal[]): Promise<void> {
    await browser.storage.local.set({ [KEYS.goals]: goals });
  }
}
