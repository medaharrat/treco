import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, unknown> = {};

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: vi.fn(async (key: string) => {
          delete store[key];
        })
      }
    }
  }
}));

const { WebExtensionStorageAdapter } = await import("../src/platform/storage.js");
const { buildUsageEvent } = await import("@ai-footprint/core");

function sampleEvent() {
  return buildUsageEvent({ provider: "claude", model: "claude-sonnet", inputTokens: 40, outputTokens: 120, tokenMethod: "estimated" });
}

describe("WebExtensionStorageAdapter", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  it("stores and retrieves events via browser.storage.local", async () => {
    const storage = new WebExtensionStorageAdapter();
    await storage.addEvent(sampleEvent());
    const events = await storage.getEvents();
    expect(events).toHaveLength(1);
  });

  it("rejects a privacy-unsafe event before writing to browser.storage.local", async () => {
    const storage = new WebExtensionStorageAdapter();
    const bad = { ...sampleEvent(), leaked: "should never persist" };
    await expect(storage.addEvent(bad as never)).rejects.toThrow();
    expect(await storage.getEvents()).toHaveLength(0);
  });

  it("returns default settings when nothing has been stored yet", async () => {
    const storage = new WebExtensionStorageAdapter();
    const settings = await storage.getSettings();
    expect(settings.enabledProviders).toEqual([]);
    expect(settings.onboardingCompleted).toBe(false);
  });

  it("clearAllEvents empties storage", async () => {
    const storage = new WebExtensionStorageAdapter();
    await storage.addEvent(sampleEvent());
    await storage.clearAllEvents();
    expect(await storage.getEvents()).toHaveLength(0);
  });
});
