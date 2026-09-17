/**
 * Shared, browser-agnostic types for AI Footprint.
 *
 * Nothing in this file may depend on DOM, chrome.*, or browser.* APIs -
 * it must run in Node (tests), the background service worker, content
 * scripts, and the React UI alike.
 */

/** How confident we are in a given estimate. Never implies exactness. */
export type Confidence = "high" | "medium" | "low";

/**
 * How a token count was obtained.
 * - "exact": the provider's own UI/network response exposed a real count.
 * - "estimated": derived locally from captured text using a character/word heuristic.
 * - "inferred": no text was available at all (e.g. blocked by CSP); derived from a
 *   per-request fallback average for that provider/model.
 */
export type TokenCountMethod = "exact" | "estimated" | "inferred";

/** Canonical provider identifier, e.g. "chatgpt", "claude", "gemini". */
export type ProviderId = string;

/** Canonical model identifier scoped to a provider, e.g. "gpt-4o", "claude-sonnet". */
export type ModelId = string;

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  /** Hostnames (no protocol, no path) this provider is served from. */
  domains: string[];
  /** Short, user-facing description of the product. */
  description: string;
  /** Brand accent color used in charts/badges (hex). */
  color: string;
  /** Known model ids this provider exposes in its consumer web app, for display grouping. */
  knownModels: ModelId[];
  /** Free-text note on what usage signal is realistically available for this provider. */
  observability: "dom-heuristic" | "network-assisted";
}

/**
 * A single, privacy-preserving record of one AI interaction.
 * Deliberately excludes prompt/response text, page content, cookies, or any PII.
 */
export interface UsageEvent {
  /** Locally generated identifier (not derived from any account/session id). */
  id: string;
  provider: ProviderId;
  model: ModelId;
  /** Epoch milliseconds. */
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokenMethod: TokenCountMethod;
  /** Estimated energy in watt-hours for this single interaction. */
  energyWh: number;
  /** Estimated CO2-equivalent emissions in grams. */
  co2eGrams: number;
  /** Estimated water use in milliliters. */
  waterMl: number;
  /** Overall confidence for the environmental figures on this event. */
  confidence: Confidence;
  /** Id of the ModelFootprintProfile used to compute this event's figures. */
  profileId: string;
  /** Uncertainty band around energyWh, e.g. { low: 0.6x, high: 1.8x central estimate }. */
  energyWhRange: [number, number];
}

/**
 * Model-specific (or fallback-tier) footprint coefficients.
 * If reliable model-specific data does not exist, a clearly labeled fallback
 * tier profile is used instead - never a single universal constant.
 */
export interface ModelFootprintProfile {
  /** Unique id, e.g. "openai/gpt-4o" or "fallback/large-dense". */
  id: string;
  provider: string;
  model: string;
  /** IT-equipment energy per input token, in watt-hours. */
  inputWhPerToken?: number;
  /** IT-equipment energy per output token, in watt-hours (usually >> input). */
  outputWhPerToken?: number;
  /** Flat IT-equipment energy per request, used when per-token data is unavailable. */
  whPerRequest?: number;
  /** Datacenter Power Usage Effectiveness multiplier applied to IT energy. */
  pue: number;
  /** Grid carbon intensity assumption, grams CO2e per kWh of facility energy. */
  carbonIntensityGPerKwh: number;
  /** Water Usage Effectiveness: mL of water per kWh of facility energy. */
  waterMlPerKwh: number;
  /** Multipliers applied to the central estimate to produce a low/high uncertainty band. */
  uncertaintyRange: { lowerMultiplier: number; upperMultiplier: number };
  confidence: Confidence;
  /** Human-readable citations - descriptions, not links, of the basis for these numbers. */
  sources: string[];
  /** ISO date string for when this profile's figures were last reviewed. */
  lastUpdated: string;
  /** True when this is a generic fallback tier rather than model-specific data. */
  isFallback: boolean;
  /** Short note explaining the assumptions behind this profile. */
  methodologyNote: string;
}

export interface FootprintEstimate {
  energyWh: number;
  energyWhRange: [number, number];
  co2eGrams: number;
  waterMl: number;
  confidence: Confidence;
  profileId: string;
  isFallback: boolean;
}

/**
 * The contract every provider content-script adapter implements.
 * Implementations live in the extension package because they touch the DOM;
 * this interface itself stays platform-agnostic.
 */
export interface AIProviderAdapter {
  id: ProviderId;
  name: string;
  domains: string[];
  /** Returns true if the current page belongs to this provider. */
  detect(): boolean;
  /** Sets up observation (e.g. MutationObserver) and starts calling the emit callback. */
  observe(emit: (event: UsageEvent | null) => void): void;
  /** Tears down any observers created by observe(). */
  disconnect(): void;
  /** One-shot extraction, mainly used in tests against static fixtures. */
  extractUsage(): UsageEvent | null;
}

export type Period = "day" | "week" | "month" | "year" | "all";

export interface PeriodStats {
  period: Period;
  /** Inclusive start / exclusive end, epoch ms. */
  rangeStart: number;
  rangeEnd: number;
  interactionCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  energyWh: number;
  co2eGrams: number;
  waterMl: number;
  providerCount: number;
  topProvider: ProviderId | null;
  topModel: ModelId | null;
  providerBreakdown: Array<{ provider: ProviderId; share: number; totalTokens: number; energyWh: number; co2eGrams: number; waterMl: number }>;
  modelBreakdown: Array<{ provider: ProviderId; model: ModelId; share: number; totalTokens: number; energyWh: number; co2eGrams: number; waterMl: number }>;
}

export interface TimeSeriesPoint {
  bucketStart: number;
  tokens: number;
  energyWh: number;
  co2eGrams: number;
  waterMl: number;
  interactionCount: number;
}

export type InsightKind =
  | "trend-up"
  | "trend-down"
  | "top-contributor"
  | "output-heavy"
  | "streak"
  | "optimization"
  | "milestone";

export interface Insight {
  id: string;
  kind: InsightKind;
  message: string;
  /** Optional supporting numbers for UI emphasis, kept generic on purpose. */
  data?: Record<string, number | string>;
}

export type GoalMetric = "energyWh" | "co2eGrams" | "waterMl" | "totalTokens";
export type GoalPeriod = "weekly" | "monthly";

export interface Goal {
  id: string;
  metric: GoalMetric;
  period: GoalPeriod;
  target: number;
  createdAt: number;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  ratio: number;
  onTrack: boolean;
}

export interface ExtensionSettings {
  enabledProviders: ProviderId[];
  theme: "system" | "light" | "dark";
  units: "metric" | "imperial";
  carbonIntensityOverrideGPerKwh: number | null;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabledProviders: [],
  theme: "system",
  units: "metric",
  carbonIntensityOverrideGPerKwh: null,
  notificationsEnabled: false,
  onboardingCompleted: false
};
