import type { UsageEvent } from "../types.js";

/**
 * The exhaustive set of fields a UsageEvent may ever contain. Used as a
 * runtime guardrail (not just a compile-time type) so that even a
 * programming mistake elsewhere in the codebase cannot silently start
 * persisting extra data - including, most importantly, conversation text.
 */
export const USAGE_EVENT_ALLOWED_KEYS: ReadonlySet<keyof UsageEvent> = new Set([
  "id",
  "provider",
  "model",
  "timestamp",
  "inputTokens",
  "outputTokens",
  "totalTokens",
  "tokenMethod",
  "energyWh",
  "co2eGrams",
  "waterMl",
  "confidence",
  "profileId",
  "energyWhRange"
]);

/** Any string field longer than this is almost certainly not a provider/model/profile id - it's leaked content. */
const MAX_PLAUSIBLE_STRING_FIELD_LENGTH = 128;

export class PrivacyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyViolationError";
  }
}

/**
 * Throws if a stored/about-to-be-stored event contains any field outside the
 * documented UsageEvent shape, or any string field implausibly long enough to
 * plausibly be raw conversation text.
 */
export function assertPrivacySafe(event: unknown): asserts event is UsageEvent {
  if (typeof event !== "object" || event === null) {
    throw new PrivacyViolationError("event is not an object");
  }

  const keys = Object.keys(event as Record<string, unknown>);
  for (const key of keys) {
    if (!USAGE_EVENT_ALLOWED_KEYS.has(key as keyof UsageEvent)) {
      throw new PrivacyViolationError(`unexpected field on stored event: "${key}"`);
    }
  }

  for (const key of ["id", "provider", "model", "tokenMethod", "confidence", "profileId"] as const) {
    const value = (event as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > MAX_PLAUSIBLE_STRING_FIELD_LENGTH) {
      throw new PrivacyViolationError(`field "${key}" is implausibly long for its type - possible content leak`);
    }
  }
}

/** Non-throwing variant for call sites that want to skip a bad event instead of crashing. */
export function isPrivacySafe(event: unknown): event is UsageEvent {
  try {
    assertPrivacySafe(event);
    return true;
  } catch {
    return false;
  }
}
