import { getProviderById } from "../providers/registry.js";
import { CANDIDATE_LIMITS, type UsageEventCandidate } from "./candidate.js";

const VALID_TOKEN_METHODS = new Set(["exact", "estimated", "inferred"]);

export type ValidationResult =
  | { ok: true; value: UsageEventCandidate }
  | { ok: false; reason: string };

/**
 * Strictly validates a message received over the extension messaging
 * boundary before it is ever persisted or used in a calculation. This is the
 * chokepoint that stops malformed, oversized, or out-of-range data (whether
 * from a buggy adapter or a page that somehow influenced the DOM adversarially)
 * from reaching storage or the environmental calculation engine.
 *
 * Deliberately rejects unknown/extra fields rather than stripping them, so a
 * message can never smuggle unexpected data through silently.
 */
export function validateUsageEventCandidate(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "payload must be a plain object" };
  }

  const allowedKeys = new Set(["provider", "model", "inputTokens", "outputTokens", "tokenMethod", "timestamp"]);
  const keys = Object.keys(raw as Record<string, unknown>);
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      return { ok: false, reason: `unexpected field: ${key}` };
    }
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.provider !== "string" || obj.provider.length === 0 || obj.provider.length > CANDIDATE_LIMITS.maxProviderLength) {
    return { ok: false, reason: "invalid provider" };
  }
  if (!getProviderById(obj.provider)) {
    return { ok: false, reason: "unknown provider id" };
  }

  if (typeof obj.model !== "string" || obj.model.length === 0 || obj.model.length > CANDIDATE_LIMITS.maxModelLength) {
    return { ok: false, reason: "invalid model" };
  }

  if (!isFiniteNonNegativeNumber(obj.inputTokens) || obj.inputTokens > CANDIDATE_LIMITS.maxTokensPerEvent) {
    return { ok: false, reason: "invalid inputTokens" };
  }
  if (!isFiniteNonNegativeNumber(obj.outputTokens) || obj.outputTokens > CANDIDATE_LIMITS.maxTokensPerEvent) {
    return { ok: false, reason: "invalid outputTokens" };
  }

  if (typeof obj.tokenMethod !== "string" || !VALID_TOKEN_METHODS.has(obj.tokenMethod)) {
    return { ok: false, reason: "invalid tokenMethod" };
  }

  let timestamp: number | undefined;
  if (obj.timestamp !== undefined) {
    if (!isFiniteNonNegativeNumber(obj.timestamp)) {
      return { ok: false, reason: "invalid timestamp" };
    }
    const now = Date.now();
    if (obj.timestamp > now + CANDIDATE_LIMITS.maxFutureSkewMs) {
      return { ok: false, reason: "timestamp too far in the future" };
    }
    if (now - obj.timestamp > CANDIDATE_LIMITS.maxAgeMs) {
      return { ok: false, reason: "timestamp implausibly old" };
    }
    timestamp = obj.timestamp;
  }

  return {
    ok: true,
    value: {
      provider: obj.provider,
      model: obj.model,
      inputTokens: obj.inputTokens as number,
      outputTokens: obj.outputTokens as number,
      tokenMethod: obj.tokenMethod as UsageEventCandidate["tokenMethod"],
      timestamp
    }
  };
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
