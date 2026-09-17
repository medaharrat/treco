import { DEFAULT_SETTINGS, type ExtensionSettings, type Goal, type UsageEvent } from "../types.js";
import { assertPrivacySafe } from "../privacy/guard.js";
import { MAX_STORED_EVENTS, type StorageAdapter } from "./StorageAdapter.js";

/** Simple in-memory StorageAdapter used by tests and as a reference implementation. */
export class MemoryStorageAdapter implements StorageAdapter {
  private events: UsageEvent[] = [];
  private settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  private goals: Goal[] = [];

  async getEvents(): Promise<UsageEvent[]> {
    return [...this.events];
  }

  async addEvent(event: UsageEvent): Promise<void> {
    assertPrivacySafe(event);
    this.events.push(event);
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events = this.events.slice(this.events.length - MAX_STORED_EVENTS);
    }
  }

  async replaceAllEvents(events: UsageEvent[]): Promise<void> {
    for (const e of events) assertPrivacySafe(e);
    this.events = [...events].slice(-MAX_STORED_EVENTS);
  }

  async clearAllEvents(): Promise<void> {
    this.events = [];
  }

  async getSettings(): Promise<ExtensionSettings> {
    return { ...this.settings };
  }

  async setSettings(settings: ExtensionSettings): Promise<void> {
    this.settings = { ...settings };
  }

  async getGoals(): Promise<Goal[]> {
    return [...this.goals];
  }

  async setGoals(goals: Goal[]): Promise<void> {
    this.goals = [...goals];
  }
}
