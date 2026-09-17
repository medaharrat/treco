import { describe, it, expect } from "vitest";
import { buildUsageEvent } from "../src/events/build.js";
import { validateUsageEventCandidate } from "../src/events/validate.js";
import { assertPrivacySafe, isPrivacySafe, PrivacyViolationError, USAGE_EVENT_ALLOWED_KEYS } from "../src/privacy/guard.js";
import { exportEventsAsCSV, parseImportedJSON } from "../src/storage/exportImport.js";
import { MAX_STORED_EVENTS } from "../src/storage/StorageAdapter.js";
import { MemoryStorageAdapter } from "../src/storage/memoryStorage.js";
import { PROVIDER_REGISTRY, getProviderByDomain } from "../src/providers/registry.js";

function sampleEvent() {
  return buildUsageEvent({
    provider: "claude",
    model: "claude-sonnet",
    inputTokens: 50,
    outputTokens: 150,
    tokenMethod: "estimated"
  });
}

/**
 * Dedicated security/privacy invariant suite. These tests exist so that a
 * future change which weakens a privacy guarantee fails CI, rather than
 * relying on someone noticing in code review.
 */
describe("security: storage schema is a strict allow-list", () => {
  it("stored events contain only the documented fields", () => {
    const event = sampleEvent();
    for (const key of Object.keys(event)) {
      expect(USAGE_EVENT_ALLOWED_KEYS.has(key as keyof typeof event)).toBe(true);
    }
  });

  it("rejects an object where a primitive string field is expected", () => {
    const tampered = { ...sampleEvent(), model: { toString: () => "gpt-4o" } };
    expect(isPrivacySafe(tampered)).toBe(false);
  });

  it("rejects an array where a primitive number field is expected", () => {
    const tampered = { ...sampleEvent(), inputTokens: [1, 2, 3] };
    expect(isPrivacySafe(tampered)).toBe(false);
  });

  it("rejects a nested object smuggled in as energyWhRange", () => {
    const tampered = { ...sampleEvent(), energyWhRange: { low: 1, high: 2 } };
    expect(isPrivacySafe(tampered)).toBe(false);
  });

  it("rejects an event that is itself an array", () => {
    expect(isPrivacySafe([sampleEvent()])).toBe(false);
  });

  it("rejects out-of-enum tokenMethod/confidence values even if the type is a string", () => {
    expect(isPrivacySafe({ ...sampleEvent(), tokenMethod: "trust-me-its-exact" })).toBe(false);
    expect(isPrivacySafe({ ...sampleEvent(), confidence: "certain" })).toBe(false);
  });

  it("rejects a conversation-shaped string smuggled into an allowed field", () => {
    const fakeConversation =
      "User: What's the capital of France, and can you also explain a bit about its history and " +
      "population? Assistant: The capital of France is Paris, a city known for its rich history...";
    expect(fakeConversation.length).toBeGreaterThan(128);
    const tampered = { ...sampleEvent(), model: fakeConversation };
    expect(isPrivacySafe(tampered)).toBe(false);
  });

  it("throws a typed PrivacyViolationError, not a generic error", () => {
    expect(() => assertPrivacySafe({ ...sampleEvent(), extra: "x" })).toThrow(PrivacyViolationError);
  });
});

describe("security: message boundary rejects untrusted shapes", () => {
  it("rejects a payload with a raw text field alongside otherwise-valid data", () => {
    const result = validateUsageEventCandidate({
      provider: "claude",
      model: "claude-sonnet",
      inputTokens: 10,
      outputTokens: 20,
      tokenMethod: "estimated",
      conversationText: "this must never cross the boundary"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects object/array values for fields that must be primitives", () => {
    expect(validateUsageEventCandidate({ provider: ["claude"], model: "x", inputTokens: 1, outputTokens: 1, tokenMethod: "estimated" }).ok).toBe(
      false
    );
    expect(
      validateUsageEventCandidate({ provider: "claude", model: "x", inputTokens: { n: 1 }, outputTokens: 1, tokenMethod: "estimated" }).ok
    ).toBe(false);
  });
});

describe("security: deleting data removes all of it", () => {
  it("clearAllEvents leaves zero events behind", async () => {
    const storage = new MemoryStorageAdapter();
    await storage.addEvent(sampleEvent());
    await storage.addEvent(sampleEvent());
    await storage.addEvent(sampleEvent());
    expect(await storage.getEvents()).toHaveLength(3);

    await storage.clearAllEvents();

    expect(await storage.getEvents()).toHaveLength(0);
  });
});

describe("security: import validation enforces size and schema limits", () => {
  it("rejects an import array larger than the stored-event cap", () => {
    const tooMany = JSON.stringify(Array.from({ length: MAX_STORED_EVENTS + 1 }, () => sampleEvent()));
    expect(() => parseImportedJSON(tooMany)).toThrow(/too many events/i);
  });

  it("rejects an oversized raw import payload before attempting to parse it", () => {
    const huge = "[" + "1".repeat(30 * 1024 * 1024) + "]";
    expect(() => parseImportedJSON(huge)).toThrow(/too large/i);
  });

  it("rejects imported events with unexpected fields", () => {
    const tampered = JSON.stringify([{ ...sampleEvent(), rawPrompt: "leaked" }]);
    expect(() => parseImportedJSON(tampered)).toThrow(PrivacyViolationError);
  });

  it("rejects an import that is a plain object with no events array", () => {
    expect(() => parseImportedJSON(JSON.stringify({ foo: "bar" }))).toThrow();
  });
});

describe("security: CSV export neutralizes spreadsheet formula injection", () => {
  it("prefixes a formula-like model name with a quote so it can't execute in a spreadsheet", () => {
    const malicious = buildUsageEvent({
      provider: "claude",
      model: "=cmd|' /C calc'!A0",
      inputTokens: 1,
      outputTokens: 1,
      tokenMethod: "estimated"
    });
    const csv = exportEventsAsCSV([malicious]);
    expect(csv).not.toContain('"=cmd');
    expect(csv).toContain("'=cmd");
  });

  it.each(["=1+1", "+1+1", "-1+1", "@SUM(A1:A2)", "\tmalicious"])("neutralizes a leading %s", (payload) => {
    const event = buildUsageEvent({ provider: "claude", model: payload, inputTokens: 1, outputTokens: 1, tokenMethod: "estimated" });
    const csv = exportEventsAsCSV([event]);
    const modelCell = csv.split("\n")[1];
    expect(modelCell?.startsWith('"') || modelCell?.includes("'")).toBe(true);
  });
});

describe("security: provider/domain registry has no ambiguity", () => {
  it("no two providers claim the same domain", () => {
    const seen = new Map<string, string>();
    for (const provider of PROVIDER_REGISTRY) {
      for (const domain of provider.domains) {
        const existing = seen.get(domain);
        expect(existing, `domain "${domain}" is claimed by both "${existing}" and "${provider.id}"`).toBeUndefined();
        seen.set(domain, provider.id);
      }
    }
  });

  it("getProviderByDomain resolves every registered domain back to its own provider", () => {
    for (const provider of PROVIDER_REGISTRY) {
      for (const domain of provider.domains) {
        expect(getProviderByDomain(domain)?.id).toBe(provider.id);
      }
    }
  });

  it("returns undefined for an unrelated domain", () => {
    expect(getProviderByDomain("evil.example.com")).toBeUndefined();
  });
});
