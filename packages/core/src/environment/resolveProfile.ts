import type { ModelFootprintProfile } from "../types.js";
import { DISCLOSED_PROFILES, FALLBACK_PROFILES } from "./modelProfiles.js";

type Tier = keyof typeof FALLBACK_PROFILES;

/**
 * Rough model-name heuristics used only to pick a fallback tier when no
 * disclosed, model-specific profile matches. This never claims to identify
 * the model precisely - it is purely for choosing a defensible order of
 * magnitude.
 */
const TIER_KEYWORDS: Array<{ tier: Tier; keywords: string[] }> = [
  // Checked first: multi-step tool-using modes do substantially more hidden
  // work than a single reasoning pass, so a name matching both ("o3 deep
  // research") should resolve to the heavier agentic tier, not reasoning.
  { tier: "agentic", keywords: ["deep research", "deep-research", "research agent", "agent mode", "operator", "computer use"] },
  { tier: "reasoning", keywords: ["o1", "o3", "o4", "reasoner", "reasoning", "extended thinking", "think"] },
  { tier: "small", keywords: ["mini", "flash", "haiku", "nano", "lite", "small"] },
  { tier: "large", keywords: ["opus", "ultra", "large", "pro-max", "405b"] }
];

function tierForModelName(model: string): Tier {
  const lower = model.toLowerCase();
  for (const { tier, keywords } of TIER_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return tier;
  }
  return "medium";
}

export interface ProfileLookup {
  /** Extra profiles supplied by the caller (e.g. user-provided overrides), tried before the built-in database. */
  extraProfiles?: ModelFootprintProfile[];
}

/**
 * Resolves the best available ModelFootprintProfile for a given provider/model,
 * preferring an exact disclosed profile, then falling back to a labeled tier.
 */
export function resolveProfile(provider: string, model: string, lookup: ProfileLookup = {}): ModelFootprintProfile {
  const tier = tierForModelName(model);

  // Disclosed provider-level averages (e.g. OpenAI's/Google's published
  // per-query figures) describe that provider's default consumer model, not
  // extended-reasoning or multi-step agent/deep-research variants that do
  // substantial hidden work. Those get their own tier instead, even when a
  // disclosed profile exists for the provider - see each profile's
  // methodologyNote.
  if (tier !== "reasoning" && tier !== "agentic") {
    const candidates = [...(lookup.extraProfiles ?? []), ...DISCLOSED_PROFILES];
    const exact = candidates.find((p) => p.provider === provider);
    if (exact) return exact;
  }

  return FALLBACK_PROFILES[tier];
}
