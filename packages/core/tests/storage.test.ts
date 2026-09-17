import { describe, it, expect } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memoryStorage.js";
import { buildUsageEvent } from "../src/events/build.js";
import { exportEventsAsCSV, exportEventsAsJSON, parseImportedJSON } from "../src/storage/exportImport.js";
import { assertPrivacySafe, isPrivacySafe, PrivacyViolationError } from "../src/privacy/guard.js";

function sampleEvent() {
  return buildUsageEvent({
    provider: "claude",
    model: "claude-sonnet",
    inputTokens: 50,
    outputTokens: 150,
    tokenMethod: "estimated"
  });
}

describe("MemoryStorageAdapter", () => {
  it("stores and retrieves events", async () => {
    const storage = new MemoryStorageAdapter();
    const event = sampleEvent();
    await storage.addEvent(event);
    const events = await storage.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe(event.id);
  });

  it("clears all events", async () => {
    const storage = new MemoryStorageAdapter();
    await storage.addEvent(sampleEvent());
    await storage.clearAllEvents();
    expect(await storage.getEvents()).toHaveLength(0);
  });

  it("persists and returns settings and goals independently of events", async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setSettings({
      enabledProviders: ["claude"],
      theme: "dark",
      units: "metric",
      carbonIntensityOverrideGPerKwh: null,
      onboardingCompleted: true
    });
    const settings = await storage.getSettings();
    expect(settings.theme).toBe("dark");
    expect(settings.onboardingCompleted).toBe(true);
  });

  it("rejects a privacy-unsafe event before it is stored", async () => {
    const storage = new MemoryStorageAdapter();
    const bad = { ...sampleEvent(), rawPrompt: "this should never be here" } as unknown;
    await expect(storage.addEvent(bad as never)).rejects.toThrow(PrivacyViolationError);
  });
});

describe("privacy guard", () => {
  it("accepts a well-formed event", () => {
    expect(() => assertPrivacySafe(sampleEvent())).not.toThrow();
    expect(isPrivacySafe(sampleEvent())).toBe(true);
  });

  it("rejects any extra field, even benign-sounding ones", () => {
    const withExtra = { ...sampleEvent(), sessionCookie: "abc" };
    expect(isPrivacySafe(withExtra)).toBe(false);
  });

  it("rejects implausibly long string fields (possible leaked text)", () => {
    const withLongModel = { ...sampleEvent(), model: "x".repeat(500) };
    expect(isPrivacySafe(withLongModel)).toBe(false);
  });
});

describe("export/import", () => {
  it("round-trips events through JSON export/import", () => {
    const events = [sampleEvent(), sampleEvent()];
    const json = exportEventsAsJSON(events);
    const parsed = parseImportedJSON(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.id).toBe(events[0]?.id);
  });

  it("produces CSV with a header row and one row per event", () => {
    const events = [sampleEvent()];
    const csv = exportEventsAsCSV(events);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("provider");
  });

  it("throws on malformed import data instead of silently accepting it", () => {
    expect(() => parseImportedJSON("not json")).toThrow();
    expect(() => parseImportedJSON(JSON.stringify({ notEvents: true }))).toThrow();
  });

  it("throws on import data containing disallowed fields", () => {
    const tampered = JSON.stringify([{ ...sampleEvent(), text: "leaked" }]);
    expect(() => parseImportedJSON(tampered)).toThrow();
  });
});
