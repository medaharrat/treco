import { describe, it, expect } from "vitest";
import { calculateFootprint } from "../src/environment/calculate.js";
import { resolveProfile } from "../src/environment/resolveProfile.js";
import { FALLBACK_PROFILES, DISCLOSED_PROFILES } from "../src/environment/modelProfiles.js";
import { compareEnergy, primaryComparisonSentence } from "../src/environment/comparisons.js";

describe("resolveProfile", () => {
  it("uses a disclosed profile for chatgpt", () => {
    const profile = resolveProfile("chatgpt", "gpt-4o");
    expect(profile.isFallback).toBe(false);
    expect(profile.provider).toBe("chatgpt");
  });

  it("falls back to a labeled tier for providers with no disclosure", () => {
    const profile = resolveProfile("claude", "claude-opus");
    expect(profile.isFallback).toBe(true);
    expect(profile.confidence).toBe("low");
  });

  it("picks the small tier for mini/flash/haiku-like model names", () => {
    const profile = resolveProfile("claude", "claude-3-haiku");
    expect(profile).toBe(FALLBACK_PROFILES.small);
  });

  it("picks the reasoning tier for reasoning-flagged models", () => {
    const profile = resolveProfile("deepseek", "deepseek-reasoner");
    expect(profile).toBe(FALLBACK_PROFILES.reasoning);
  });
});

describe("calculateFootprint", () => {
  it("produces strictly positive, finite figures for a normal request", () => {
    const result = calculateFootprint({ provider: "claude", model: "claude-sonnet", inputTokens: 500, outputTokens: 800 });
    expect(result.energyWh).toBeGreaterThan(0);
    expect(Number.isFinite(result.energyWh)).toBe(true);
    expect(result.co2eGrams).toBeGreaterThan(0);
    expect(result.waterMl).toBeGreaterThan(0);
    expect(result.energyWhRange[0]).toBeLessThanOrEqual(result.energyWh);
    expect(result.energyWhRange[1]).toBeGreaterThanOrEqual(result.energyWh);
  });

  it("returns zero energy for zero tokens against a per-token profile", () => {
    const result = calculateFootprint({ provider: "claude", model: "claude-sonnet", inputTokens: 0, outputTokens: 0 });
    expect(result.energyWh).toBe(0);
    expect(result.co2eGrams).toBe(0);
    expect(result.waterMl).toBe(0);
  });

  it("uses whPerRequest as a flat cost regardless of token count for disclosed profiles", () => {
    const small = calculateFootprint({ provider: "chatgpt", model: "gpt-4o", inputTokens: 10, outputTokens: 10 });
    const large = calculateFootprint({ provider: "chatgpt", model: "gpt-4o", inputTokens: 5000, outputTokens: 5000 });
    expect(small.energyWh).toBeCloseTo(large.energyWh, 5);
  });

  it("respects a user-provided carbon intensity override", () => {
    const withOverride = calculateFootprint(
      { provider: "claude", model: "claude-sonnet", inputTokens: 500, outputTokens: 500 },
      { carbonIntensityOverrideGPerKwh: 10 }
    );
    const withoutOverride = calculateFootprint({ provider: "claude", model: "claude-sonnet", inputTokens: 500, outputTokens: 500 });
    expect(withOverride.co2eGrams).toBeLessThan(withoutOverride.co2eGrams);
  });

  it("never claims high confidence for a fallback profile", () => {
    for (const profile of Object.values(FALLBACK_PROFILES)) {
      expect(profile.confidence).not.toBe("high");
      expect(profile.isFallback).toBe(true);
    }
  });

  it("caps disclosed profile confidence at medium (never claims exactness)", () => {
    for (const profile of DISCLOSED_PROFILES) {
      expect(profile.confidence).toBe("medium");
    }
  });

  it("output tokens weigh at least as much as input tokens per fallback tier (generation dominates cost)", () => {
    for (const profile of Object.values(FALLBACK_PROFILES)) {
      if (profile.inputWhPerToken !== undefined && profile.outputWhPerToken !== undefined) {
        expect(profile.outputWhPerToken).toBeGreaterThanOrEqual(profile.inputWhPerToken);
      }
    }
  });
});

describe("comparisons", () => {
  it("returns zero comparisons for zero energy", () => {
    const c = compareEnergy(0);
    expect(c.smartphoneCharges).toBe(0);
    expect(c.laptopHours).toBe(0);
  });

  it("scales linearly with energy", () => {
    const a = compareEnergy(10);
    const b = compareEnergy(20);
    expect(b.laptopHours).toBeCloseTo(a.laptopHours * 2, 5);
  });

  it("produces a non-empty sentence for positive energy", () => {
    const sentence = primaryComparisonSentence(50);
    expect(sentence.length).toBeGreaterThan(10);
  });

  it("produces a neutral 'no usage' sentence for zero energy", () => {
    expect(primaryComparisonSentence(0)).toMatch(/no ai energy use/i);
  });

  it("uses seconds of an LED bulb for very small amounts, never a rounded-to-zero comparison", () => {
    const sentence = primaryComparisonSentence(0.05);
    expect(sentence).toMatch(/led bulb.*second/i);
    expect(sentence).not.toMatch(/0\.0/);
  });

  it("uses a percentage of a smartphone charge for small-but-not-tiny amounts", () => {
    const sentence = primaryComparisonSentence(0.5);
    expect(sentence).toMatch(/%.*smartphone charge/i);
    expect(sentence).not.toMatch(/0\.0/);
  });

  it("uses a whole-charge count once usage exceeds a full smartphone charge equivalent", () => {
    const sentence = primaryComparisonSentence(24); // 2 smartphone charges' worth
    expect(sentence).toMatch(/charging a smartphone/i);
  });

  it("uses laptop-hours for large amounts", () => {
    const sentence = primaryComparisonSentence(200); // 4 laptop-hours
    expect(sentence).toMatch(/laptop/i);
  });
});
