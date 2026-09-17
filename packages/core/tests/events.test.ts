import { describe, it, expect } from "vitest";
import { validateUsageEventCandidate } from "../src/events/validate.js";
import { buildUsageEvent } from "../src/events/build.js";

describe("validateUsageEventCandidate", () => {
  it("accepts a well-formed candidate", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 120,
      outputTokens: 340,
      tokenMethod: "estimated"
    });
    expect(result.ok).toBe(true);
  });

  it("rejects unknown providers", () => {
    const result = validateUsageEventCandidate({
      provider: "totally-not-real",
      model: "x",
      inputTokens: 1,
      outputTokens: 1,
      tokenMethod: "estimated"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unexpected extra fields (e.g. an injected 'text' field)", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 1,
      outputTokens: 1,
      tokenMethod: "estimated",
      text: "the user's actual prompt should never appear here"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects negative token counts", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: -5,
      outputTokens: 1,
      tokenMethod: "estimated"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects absurdly large token counts", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 999_999_999,
      outputTokens: 1,
      tokenMethod: "estimated"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid tokenMethod", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 1,
      outputTokens: 1,
      tokenMethod: "definitely-exact-trust-me"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects non-object payloads", () => {
    expect(validateUsageEventCandidate("hello").ok).toBe(false);
    expect(validateUsageEventCandidate(null).ok).toBe(false);
    expect(validateUsageEventCandidate([1, 2, 3]).ok).toBe(false);
  });

  it("rejects timestamps far in the future", () => {
    const result = validateUsageEventCandidate({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 1,
      outputTokens: 1,
      tokenMethod: "estimated",
      timestamp: Date.now() + 1000 * 60 * 60 * 24
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildUsageEvent", () => {
  it("builds a fully-formed event with computed footprint figures", () => {
    const event = buildUsageEvent({
      provider: "chatgpt",
      model: "gpt-4o",
      inputTokens: 100,
      outputTokens: 200,
      tokenMethod: "estimated"
    });
    expect(event.id).toBeTruthy();
    expect(event.totalTokens).toBe(300);
    expect(event.energyWh).toBeGreaterThan(0);
    expect(event.profileId).toBeTruthy();
  });
});
