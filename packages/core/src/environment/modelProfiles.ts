import type { ModelFootprintProfile } from "../types.js";

/**
 * Model footprint profile database.
 *
 * Two kinds of entries live here:
 *
 * 1. Disclosed, provider-published aggregate figures (OpenAI, Google) - the
 *    closest thing to "model-specific data" realistically available to a
 *    browser extension. These providers have published approximate per-query
 *    energy/water figures; we back-calculate per-kWh coefficients so they fit
 *    the same calculation engine as everything else. They are still
 *    estimates - the providers themselves have not published full
 *    methodologies - so confidence is capped at "medium", never "high".
 *
 * 2. Fallback tiers, keyed by a rough model size/behavior class
 *    (small / medium / large / reasoning). These are used for every provider
 *    or model we do not have a credible public disclosure for. They are
 *    intentionally wide-banded and always marked isFallback: true and
 *    confidence: "low".
 *
 * We deliberately do NOT hardcode a single universal Wh-per-token or
 * gCO2e-per-token constant anywhere in this codebase.
 */

const GLOBAL_AVG_CARBON_INTENSITY_G_PER_KWH = 442; // approx. global grid average, IEA-style order of magnitude
const GLOBAL_AVG_WUE_ML_PER_KWH = 1800; // approx. data center site WUE industry average (Uptime Institute-style order of magnitude)
const GLOBAL_AVG_PUE = 1.5; // approx. global data center PUE average

function fallbackTier(params: {
  id: string;
  label: string;
  inputWhPerToken: number;
  outputWhPerToken: number;
  note: string;
}): ModelFootprintProfile {
  return {
    id: `fallback/${params.id}`,
    provider: "fallback",
    model: params.label,
    inputWhPerToken: params.inputWhPerToken,
    outputWhPerToken: params.outputWhPerToken,
    pue: GLOBAL_AVG_PUE,
    carbonIntensityGPerKwh: GLOBAL_AVG_CARBON_INTENSITY_G_PER_KWH,
    waterMlPerKwh: GLOBAL_AVG_WUE_ML_PER_KWH,
    uncertaintyRange: { lowerMultiplier: 0.4, upperMultiplier: 2.5 },
    confidence: "low",
    isFallback: true,
    sources: [
      "Order-of-magnitude estimate derived from publicly discussed LLM inference energy studies " +
        "(e.g. academic life-cycle-assessment papers and industry sustainability reports); " +
        "no model-specific disclosure exists for this model, so a generic size/behavior tier is used.",
      "Global average PUE and data center water usage effectiveness figures are industry survey order-of-magnitude averages."
    ],
    lastUpdated: "2026-01-01",
    methodologyNote: params.note
  };
}

export const FALLBACK_PROFILES = {
  small: fallbackTier({
    id: "small",
    label: "Small / lightweight model (fallback tier)",
    inputWhPerToken: 0.0001,
    outputWhPerToken: 0.0005,
    note:
      "Applied to compact/'mini'/'flash'/'haiku'-class models, which are generally optimized for low latency and cost."
  }),
  medium: fallbackTier({
    id: "medium",
    label: "Standard chat model (fallback tier)",
    inputWhPerToken: 0.0002,
    outputWhPerToken: 0.0012,
    note: "Applied to a provider's general-purpose default chat model when no disclosure is available."
  }),
  large: fallbackTier({
    id: "large",
    label: "Large / flagship model (fallback tier)",
    inputWhPerToken: 0.0004,
    outputWhPerToken: 0.003,
    note: "Applied to flagship/'opus'/'ultra'-class models, which typically run more parameters per token."
  }),
  reasoning: fallbackTier({
    id: "reasoning",
    label: "Extended-reasoning model (fallback tier)",
    inputWhPerToken: 0.0004,
    outputWhPerToken: 0.006,
    note:
      "Applied to models that generate substantial hidden chain-of-thought/reasoning tokens in addition to " +
      "the visible response, which the browser cannot observe directly. The higher coefficient is a coarse " +
      "attempt to account for that unobserved compute."
  })
} satisfies Record<string, ModelFootprintProfile>;

/**
 * Disclosed, provider-published profiles. Even these are approximate: the
 * providers have published aggregate per-query figures, not full
 * methodologies, so we treat them as "medium" confidence, not "high".
 */
export const DISCLOSED_PROFILES: ModelFootprintProfile[] = [
  {
    id: "openai/chatgpt-default",
    provider: "chatgpt",
    model: "gpt-4o / default ChatGPT model",
    whPerRequest: 0.34,
    // pue = 1.0 because OpenAI's public figure is described as an all-in,
    // per-query energy estimate; applying an additional PUE would double-count.
    pue: 1.0,
    carbonIntensityGPerKwh: 369, // approx. US national average grid intensity, used to convert the disclosed water/energy figures
    waterMlPerKwh: 941, // derived from OpenAI's disclosed ~0.32 mL per query at 0.34 Wh
    uncertaintyRange: { lowerMultiplier: 0.6, upperMultiplier: 1.8 },
    confidence: "medium",
    isFallback: false,
    sources: [
      "OpenAI public estimate of average energy/water per ChatGPT query (company blog post, 2025). " +
        "OpenAI has not published a full methodology; treat as an approximate, provider-reported aggregate."
    ],
    lastUpdated: "2025-06-01",
    methodologyNote:
      "Uses OpenAI's own disclosed average per-query energy figure directly as whPerRequest (input/output token " +
      "weighting is not available at this granularity). Applies a generic US grid carbon intensity because OpenAI " +
      "did not disclose one. Treated as covering ChatGPT's default consumer model; reasoning models (o1/o3) are not " +
      "covered by this figure and fall back to the reasoning tier instead."
  },
  {
    id: "google/gemini-default",
    provider: "gemini",
    model: "Gemini (default Gemini Apps model)",
    whPerRequest: 0.24,
    pue: 1.0, // Google's figure is described as already reflecting fleet-wide, all-in energy use
    carbonIntensityGPerKwh: 125, // back-calculated from Google's disclosed ~0.03 gCO2e at 0.24 Wh
    waterMlPerKwh: 1083, // back-calculated from Google's disclosed ~0.26 mL at 0.24 Wh
    uncertaintyRange: { lowerMultiplier: 0.6, upperMultiplier: 1.8 },
    confidence: "medium",
    isFallback: false,
    sources: [
      "Google, published technical report estimating the median energy, carbon and water footprint of a Gemini " +
        "Apps text prompt (2025). Reflects Google's own fleet and clean-energy mix, which is well below grid average."
    ],
    lastUpdated: "2025-08-01",
    methodologyNote:
      "Uses Google's disclosed median per-prompt energy, carbon and water figures directly, back-calculated into " +
      "per-kWh coefficients so they fit this engine's shared calculation path. Longer or multimodal prompts " +
      "(images, video, long context) are not separately modeled and will be understated by this profile."
  }
];

export const ALL_PROFILES: ModelFootprintProfile[] = [
  ...DISCLOSED_PROFILES,
  ...Object.values(FALLBACK_PROFILES)
];

export function getGlobalDefaultAssumptions() {
  return {
    carbonIntensityGPerKwh: GLOBAL_AVG_CARBON_INTENSITY_G_PER_KWH,
    waterMlPerKwh: GLOBAL_AVG_WUE_ML_PER_KWH,
    pue: GLOBAL_AVG_PUE
  };
}
