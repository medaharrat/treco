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
  { tier: "reasoning", keywords: ["o1", "o3", "reasoner", "reasoning", "think"] },
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
  // extended-reasoning variants that do substantial hidden chain-of-thought
  // work. Those get the reasoning tier instead, even when a disclosed
  // profile exists for the provider - see each profile's methodologyNote.
  if (tier !== "reasoning") {
    const candidates = [...(lookup.extraProfiles ?? []), ...DISCLOSED_PROFILES];
    const exact = candidates.find((p) => p.provider === provider);
    if (exact) return exact;
  }

  return FALLBACK_PROFILES[tier];
}
