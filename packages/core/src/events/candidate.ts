import type { TokenCountMethod } from "../types.js";

/**
 * The untrusted shape a content-script adapter sends across the
 * extension messaging boundary. It intentionally contains no text fields -
 * only numbers, a token method tag, and provider/model identifiers.
 */
export interface UsageEventCandidate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  tokenMethod: TokenCountMethod;
  /** Epoch ms; optional, background will default/clamp this. */
  timestamp?: number;
}

export const CANDIDATE_LIMITS = {
  maxProviderLength: 64,
  maxModelLength: 128,
  maxTokensPerEvent: 2_000_000, // generous upper bound; anything above this is almost certainly bad data
  maxFutureSkewMs: 5 * 60 * 1000, // allow up to 5 minutes of clock skew
  maxAgeMs: 1000 * 60 * 60 * 24 * 3650 // reject absurd past timestamps (pre-2015-ish is impossible for this product)
} as const;
