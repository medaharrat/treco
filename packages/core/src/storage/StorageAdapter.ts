import type { ExtensionSettings, Goal, UsageEvent } from "../types.js";

/**
 * Platform-agnostic persistence contract. The extension package implements
 * this on top of browser.storage.local; tests use the in-memory
 * implementation in memoryStorage.ts. Core logic never talks to chrome.* /
 * browser.* directly, which keeps aggregation/insights fully unit-testable.
 */
export interface StorageAdapter {
  getEvents(): Promise<UsageEvent[]>;
  addEvent(event: UsageEvent): Promise<void>;
  /** Bulk replace, used for import and for capped/rolling eviction. */
  replaceAllEvents(events: UsageEvent[]): Promise<void>;
  clearAllEvents(): Promise<void>;

  getSettings(): Promise<ExtensionSettings>;
  setSettings(settings: ExtensionSettings): Promise<void>;

  getGoals(): Promise<Goal[]>;
  setGoals(goals: Goal[]): Promise<void>;
}

/** Soft cap on stored events; oldest events are evicted first once exceeded. */
export const MAX_STORED_EVENTS = 50_000;
