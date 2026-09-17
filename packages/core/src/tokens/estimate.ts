import type { TokenCountMethod } from "../types.js";

export interface TokenEstimate {
  tokens: number;
  /** Low/high bound reflecting tokenizer variability across models and languages. */
  range: [number, number];
  method: TokenCountMethod;
}

/**
 * Heuristic token estimation from rendered text length, used when a provider
 * does not expose a real tokenizer count. Blends two well-known rules of thumb
 * (~4 characters/token, ~0.75 words/token for English) and never claims exactness.
 *
 * Callers should measure and discard the source text immediately - this
 * function takes a string only transiently and returns nothing but numbers.
 */
export function estimateTokensFromText(text: string): TokenEstimate {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { tokens: 0, range: [0, 0], method: "estimated" };
  }

  const charEstimate = trimmed.length / 4;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const wordEstimate = wordCount / 0.75;

  const central = (charEstimate + wordEstimate) / 2;
  const tokens = Math.max(1, Math.round(central));

  // Uncertainty band: different tokenizers (BPE variants, multilingual text,
  // code, markdown) commonly diverge 20-40% from this heuristic.
  const low = Math.max(1, Math.round(Math.min(charEstimate, wordEstimate) * 0.75));
  const high = Math.round(Math.max(charEstimate, wordEstimate) * 1.35);

  return { tokens, range: [low, high], method: "estimated" };
}

/**
 * Fast path for adapters that only capture a character count (not the full
 * string) to further minimize how much rendered text is ever touched.
 */
export function estimateTokensFromCharCount(charCount: number): TokenEstimate {
  if (charCount <= 0) return { tokens: 0, range: [0, 0], method: "estimated" };
  const central = charCount / 4;
  const tokens = Math.max(1, Math.round(central));
  return {
    tokens,
    range: [Math.max(1, Math.round(central * 0.7)), Math.round(central * 1.4)],
    method: "estimated"
  };
}

/**
 * Coarse per-turn fallback used only when no text was observable at all
 * (e.g. a page blocked script injection). Always tagged "inferred" so the UI
 * can visibly distinguish it from a text-derived estimate.
 */
export const INFERRED_TURN_DEFAULTS = {
  inputTokens: 180,
  outputTokens: 320
} as const;

export function inferredTurnEstimate(): { inputTokens: number; outputTokens: number; method: TokenCountMethod } {
  return { ...INFERRED_TURN_DEFAULTS, method: "inferred" };
}
