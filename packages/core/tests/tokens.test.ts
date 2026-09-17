import { describe, it, expect } from "vitest";
import { estimateTokensFromText, estimateTokensFromCharCount, inferredTurnEstimate } from "../src/tokens/estimate.js";

describe("estimateTokensFromText", () => {
  it("returns zero for empty text", () => {
    const result = estimateTokensFromText("   ");
    expect(result.tokens).toBe(0);
    expect(result.range).toEqual([0, 0]);
    expect(result.method).toBe("estimated");
  });

  it("estimates a plausible token count for short English text", () => {
    const result = estimateTokensFromText("The quick brown fox jumps over the lazy dog.");
    // 9 words, 45 chars -> roughly 11-15 tokens by common heuristics
    expect(result.tokens).toBeGreaterThan(5);
    expect(result.tokens).toBeLessThan(20);
    expect(result.range[0]).toBeLessThanOrEqual(result.tokens);
    expect(result.range[1]).toBeGreaterThanOrEqual(result.tokens);
  });

  it("scales roughly linearly with text length", () => {
    const short = estimateTokensFromText("Hello world");
    const long = estimateTokensFromText("Hello world ".repeat(50));
    expect(long.tokens).toBeGreaterThan(short.tokens * 20);
  });

  it("never returns a negative or non-finite value", () => {
    const result = estimateTokensFromText("a");
    expect(result.tokens).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.tokens)).toBe(true);
  });
});

describe("estimateTokensFromCharCount", () => {
  it("matches order of magnitude of the text-based estimate", () => {
    const text = "a".repeat(400);
    const fromText = estimateTokensFromText(text);
    const fromCount = estimateTokensFromCharCount(text.length);
    expect(Math.abs(fromText.tokens - fromCount.tokens)).toBeLessThan(fromText.tokens * 0.6 + 20);
  });
});

describe("inferredTurnEstimate", () => {
  it("is explicitly tagged as inferred, never estimated or exact", () => {
    const result = inferredTurnEstimate();
    expect(result.method).toBe("inferred");
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
  });
});
