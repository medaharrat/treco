import type { Confidence, TokenCountMethod, UsageEvent } from "../types.js";

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
const VALID_TOKEN_METHODS: ReadonlySet<TokenCountMethod> = new Set(["exact", "estimated", "inferred"]);
const VALID_CONFIDENCE_LEVELS: ReadonlySet<Confidence> = new Set(["high", "medium", "low"]);

const STRING_FIELDS = ["id", "provider", "model", "profileId"] as const;

/** Per-field upper bounds - generous enough for any real reading, tight enough to reject garbage/hostile data. */
const NUMBER_FIELD_MAX: Record<"timestamp" | "inputTokens" | "outputTokens" | "totalTokens" | "energyWh" | "co2eGrams" | "waterMl", number> = {
  timestamp: 10_000_000_000_000, // epoch ms; comfortably past the year 2286
  inputTokens: 10_000_000,
  outputTokens: 10_000_000,
  totalTokens: 20_000_000,
  energyWh: 1_000_000,
  co2eGrams: 1_000_000,
  waterMl: 1_000_000
};

export class PrivacyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyViolationError";
  }
}

function isFiniteNumberInRange(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

/**
 * Throws if a stored/about-to-be-stored event contains any field outside the
 * documented UsageEvent shape, any string field implausibly long enough to
 * plausibly be raw conversation text, or any field whose runtime type doesn't
 * match its declared primitive type - so an object or array can never be
 * smuggled in where a string or number is expected (whether from a bug
 * elsewhere in the codebase or a hand-crafted imported file).
 */
export function assertPrivacySafe(event: unknown): asserts event is UsageEvent {
  if (typeof event !== "object" || event === null || Array.isArray(event)) {
    throw new PrivacyViolationError("event is not a plain object");
  }

  const record = event as Record<string, unknown>;
  const keys = Object.keys(record);
  for (const key of keys) {
    if (!USAGE_EVENT_ALLOWED_KEYS.has(key as keyof UsageEvent)) {
      throw new PrivacyViolationError(`unexpected field on stored event: "${key}"`);
    }
  }

  for (const key of STRING_FIELDS) {
    const value = record[key];
    if (typeof value !== "string" || value.length === 0) {
      throw new PrivacyViolationError(`field "${key}" must be a non-empty string`);
    }
    if (value.length > MAX_PLAUSIBLE_STRING_FIELD_LENGTH) {
      throw new PrivacyViolationError(`field "${key}" is implausibly long for its type - possible content leak`);
    }
  }

  for (const key of Object.keys(NUMBER_FIELD_MAX) as Array<keyof typeof NUMBER_FIELD_MAX>) {
    if (!isFiniteNumberInRange(record[key], NUMBER_FIELD_MAX[key])) {
      throw new PrivacyViolationError(`field "${key}" must be a finite, non-negative number within range`);
    }
  }

  if (typeof record.tokenMethod !== "string" || !VALID_TOKEN_METHODS.has(record.tokenMethod as TokenCountMethod)) {
    throw new PrivacyViolationError('field "tokenMethod" must be one of "exact", "estimated", or "inferred"');
  }
  if (typeof record.confidence !== "string" || !VALID_CONFIDENCE_LEVELS.has(record.confidence as Confidence)) {
    throw new PrivacyViolationError('field "confidence" must be one of "high", "medium", or "low"');
  }

  const range = record.energyWhRange;
  if (!Array.isArray(range) || range.length !== 2 || !range.every((v) => isFiniteNumberInRange(v, NUMBER_FIELD_MAX.energyWh))) {
    throw new PrivacyViolationError('field "energyWhRange" must be a two-element tuple of finite numbers');
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
