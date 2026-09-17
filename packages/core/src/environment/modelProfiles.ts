import type { ModelFootprintProfile } from "../types.js";

/**
 * Model footprint profile database.
 *
 * Three kinds of entries live here:
 *
 * 1. Disclosed, provider-published aggregate figures (OpenAI, Google) - the
 *    closest thing to "model-specific data" realistically available to a
 *    browser extension. These providers have published approximate per-query
 *    energy/water figures; we back-calculate per-kWh coefficients so they fit
 *    the same calculation engine as everything else. They are still
 *    estimates - the providers themselves have not published full
 *    methodologies - so confidence is capped at "medium", never "high".
 *    Deliberately NOT tied to a specific model version name: providers ship
 *    new flagship models faster than any browser extension can track, so
 *    these profiles describe "whichever model a provider's disclosed figure
 *    was actually measured against" and are re-reviewed periodically rather
 *    than hardcoded to a version number that will be stale within months.
 *
 * 2. Fallback tiers, keyed by a rough model size/behavior class
 *    (small / medium / large / reasoning / agentic). These are used for every
 *    provider or model we do not have a credible public disclosure for. They
 *    are intentionally wide-banded and always marked isFallback: true and
 *    confidence: "low".
 *
 * We deliberately do NOT hardcode a single universal Wh-per-token or
 * gCO2e-per-token constant anywhere in this codebase.
 *
 * Background sources for the order-of-magnitude assumptions below (grid
 * intensity, PUE, WUE, and the general shape of LLM inference energy use)
 * are listed in full on the in-app Methodology page and in
 * docs/METHODOLOGY.md, with links.
 */

const GLOBAL_AVG_CARBON_INTENSITY_G_PER_KWH = 442; // approx. global grid average, IEA-style order of magnitude
const GLOBAL_AVG_WUE_ML_PER_KWH = 1800; // approx. data center site WUE industry average (Uptime Institute-style order of magnitude)
const GLOBAL_AVG_PUE = 1.56; // Uptime Institute Global Data Center Survey 2024 industry-average PUE

const BACKGROUND_RESEARCH_SOURCE = {
  text: "Order-of-magnitude estimate consistent with published LLM inference energy research (see the Methodology page's 'Sources & further reading' for the full academic and industry citations); no model-specific disclosure exists for this model, so a generic size/behavior tier is used.",
  url: undefined
};

const INDUSTRY_AVERAGES_SOURCE = {
  text: "Global average PUE (Uptime Institute Global Data Center Survey 2024) and data center water usage effectiveness are industry-survey order-of-magnitude averages, not measurements of any specific facility.",
  url: "https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024"
};

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
    sources: [BACKGROUND_RESEARCH_SOURCE, INDUSTRY_AVERAGES_SOURCE],
    lastUpdated: "2026-09-17",
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
  }),
  agentic: fallbackTier({
    id: "agentic",
    label: "Deep research / multi-step agent mode (fallback tier)",
    inputWhPerToken: 0.0006,
    outputWhPerToken: 0.012,
    note:
      "Applied to 'deep research', 'agent mode', or similar multi-step tool-using features that run many " +
      "internal searches, tool calls, and reasoning passes behind a single visible response. None of that " +
      "internal work is observable from the page, so this is the widest, most uncertain tier - treat it as a " +
      "lower bound rather than a precise figure. If a provider ever discloses per-task energy for these " +
      "features specifically, that would replace this tier the same way OpenAI's and Google's disclosed " +
      "per-query figures already replace it for ordinary chat."
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
    model: "ChatGPT's disclosed per-query average (default, non-reasoning model)",
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
      {
        text: "Sam Altman, \"The Gentle Singularity\" (OpenAI CEO's personal blog, June 2025): \"the average query uses about 0.34 watt-hours... it also uses about 0.000085 gallons of water.\"",
        url: "https://blog.samaltman.com/the-gentle-singularity"
      }
    ],
    lastUpdated: "2025-06-10",
    methodologyNote:
      "Uses OpenAI's own disclosed average per-query energy figure directly as whPerRequest (input/output token " +
      "weighting is not available at this granularity). Applies a generic US grid carbon intensity because OpenAI " +
      "did not disclose one. This figure is not tied to a specific named model version - OpenAI's disclosure " +
      "describes 'an average query' on its consumer product, whichever model that resolves to at the time. It " +
      "does not cover reasoning models or deep research / agent mode, which fall back to those tiers instead " +
      "regardless of which underlying model is detected."
  },
  {
    id: "google/gemini-default",
    provider: "gemini",
    model: "Gemini Apps' disclosed per-prompt median",
    whPerRequest: 0.24,
    pue: 1.0, // Google's figure is described as already reflecting fleet-wide, all-in energy use
    carbonIntensityGPerKwh: 125, // back-calculated from Google's disclosed ~0.03 gCO2e at 0.24 Wh
    waterMlPerKwh: 1083, // back-calculated from Google's disclosed ~0.26 mL at 0.24 Wh
    uncertaintyRange: { lowerMultiplier: 0.6, upperMultiplier: 1.8 },
    confidence: "medium",
    isFallback: false,
    sources: [
      {
        text: "Google, \"Measuring the environmental impact of AI inference\" (Aug 2025): the median Gemini Apps text prompt uses 0.24 Wh, 0.26 mL of water, and emits 0.03 g CO2e.",
        url: "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference"
      },
      {
        text: "Full technical report (PDF): \"Measuring the environmental impact of delivering AI at Google scale.\"",
        url: "https://services.google.com/fh/files/misc/measuring_the_environmental_impact_of_delivering_ai_at_google_scale.pdf"
      }
    ],
    lastUpdated: "2025-08-21",
    methodologyNote:
      "Uses Google's disclosed median per-prompt energy, carbon and water figures directly, back-calculated into " +
      "per-kWh coefficients so they fit this engine's shared calculation path. Longer or multimodal prompts " +
      "(images, video, long context) are not separately modeled and will be understated by this profile. Does not " +
      "cover Gemini's reasoning/'thinking' modes or Deep Research, which fall back to those tiers instead."
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
