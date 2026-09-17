# Environmental methodology

This document is the source-of-truth companion to the in-app **Settings → Environmental methodology** page
(`packages/extension/src/ui/pages/MethodologyPage.tsx`), which renders the same profile database live from
`packages/core/src/environment/modelProfiles.ts`.

## The calculation, step by step

```
tokens (input, output)
   │  × per-token or per-request energy coefficient (IT-equipment energy)
   ▼
IT-equipment energy (Wh)
   │  × PUE (Power Usage Effectiveness)
   ▼
Facility energy (Wh)
   │  × grid carbon intensity (gCO2e/kWh)         │  × WUE (mL water/kWh)
   ▼                                                ▼
Estimated CO2e (g)                             Estimated water (mL)
```

Implemented in `packages/core/src/environment/calculate.ts`. Every step is a documented, overridable assumption, not
a hidden constant.

## Token estimation

Handled by `packages/core/src/tokens/estimate.ts`. In the near-total absence of providers exposing real tokenizer
counts to a browser extension (see `docs/LIMITATIONS.md`), token counts are estimated by blending two well-known
rules of thumb for English text:

- ~4 characters per token
- ~0.75 words per token

The two estimates are averaged for a central value, with an explicit uncertainty range (roughly 0.75×–1.35× the
central estimate) to reflect that different tokenizers, non-English text, code, and markdown all diverge from this
heuristic by a meaningful margin. Every token count carries a method tag:

- `"exact"` — a provider explicitly exposed a real count (not currently used by any supported provider's consumer web
  app; the type exists so a future provider that does expose this can use it honestly)
- `"estimated"` — derived from captured text using the heuristic above
- `"inferred"` — no text was observable at all (e.g. every structured selector failed and the site's total content
  didn't grow enough to register), so a small fixed per-turn default is used instead

## Model profile database

`packages/core/src/environment/modelProfiles.ts` holds two kinds of entries:

### 1. Disclosed provider figures (confidence: `"medium"`, never `"high"`)

OpenAI and Google have each published approximate, aggregate per-query energy/water/carbon figures for their
consumer chat products. These are the closest thing to "model-specific data" realistically obtainable, so they're
used directly as `whPerRequest` (a flat per-interaction energy figure) rather than a per-token coefficient, since
that's the granularity the providers themselves disclosed. Confidence is capped at `"medium"` because neither
provider has published a full methodology — these are company-reported aggregates, not independently verified
measurements.

These profiles are deliberately **not** tied to a specific named model version (e.g. "GPT-4o"). Providers ship new
flagship models faster than any browser extension can track, and hardcoding a version number just guarantees the
label goes stale within months. Instead, each disclosed profile describes "whichever model a provider's disclosure
was actually measured against at the time," is stamped with the date it was last reviewed, and is expected to be
updated whenever a provider publishes a new figure — not whenever they ship a new model name.

Extended-reasoning variants (models whose name suggests hidden chain-of-thought generation, e.g. "o1"/"o3"-class
models) and multi-step "deep research" or agent/tool-use modes are deliberately **excluded** from these disclosed
profiles and routed to their own fallback tiers instead — see `resolveProfile.ts`. A provider's published average for
its default chat model does not represent an interaction that may run many times more hidden reasoning or tool-call
work per visible response.

### 2. Fallback tiers (confidence: `"low"`, always `isFallback: true`)

Used for every provider/model without a credible public disclosure — which, honestly, is most of them. Models and
modes are sorted into one of five broad tiers by keyword matching on the model/mode name detected from the page:

- **small** — compact/"mini"/"flash"/"haiku"-class models
- **medium** — a provider's general-purpose default chat model
- **large** — flagship/"opus"/"ultra"-class models
- **reasoning** — models producing substantial hidden chain-of-thought tokens (matched on names/labels like "o1",
  "o3", "reasoning", "extended thinking")
- **agentic** — "deep research", "agent mode", "operator", "computer use," and similar multi-step, tool-using
  features that run many internal searches/tool calls behind one visible response; checked *before* the reasoning
  tier, so a label matching both (e.g. "o3 deep research") resolves to this heavier, wider-banded tier

Each tier has its own per-token energy coefficients (output always weighted higher than input, since generation
dominates inference cost), a wide uncertainty band (0.4×–2.5×, widest for the agentic tier in practice since its
central estimate is itself the least certain), and an explicit note explaining what it's applied to and why. This is
intentionally never a single number: see `packages/core/tests/environment.test.ts` for tests asserting no fallback
profile is ever presented at `"high"` confidence, that output coefficients are never lower than input coefficients,
and that agentic-mode labels are never routed to a disclosed provider profile.

This keyword-matching approach is inherently a coarse, best-effort heuristic based on whatever model/mode label a
provider's page happens to expose - not a measurement of what actually ran. It is the largest source of uncertainty
in the whole calculation, most of all for reasoning and agentic modes.

## Other providers we checked

Only OpenAI and Google have a disclosed profile. Before adding one for any other provider, we checked what's actually
been published, rather than assuming either "no one else discloses anything" or reaching for a third-party estimate
and treating it as if the company said it:

- **Mistral (Le Chat)** published a genuinely rigorous disclosure — an ISO 14040/44-compliant lifecycle assessment
  (with Carbone 4 and the French environmental agency ADEME) giving 1.14 g CO2e and 45 mL water per 400-token
  response. It's arguably more methodologically solid than OpenAI's or Google's blog-post figures. But it doesn't
  include an energy (Wh) number — confirmed by checking the primary announcement directly, not assumed — and Wh is
  the one quantity this engine's entire calculation is built around (tokens → energy → CO2e/water, in that order).
  Deriving an implied energy figure from their CO2e using our own assumed grid intensity would mean inventing the
  one number they didn't give us, which is exactly what this project tries not to do. Le Chat stays on the generic
  fallback tier until/unless Mistral (or an independent audit of their methodology) discloses the energy figure too.
- **Anthropic (Claude)** has published no per-query energy, water, or carbon figure. Third-party estimates exist
  online; none are Anthropic's own disclosure, so none are treated as one.
- **DeepSeek** has published nothing official either. An independent academic benchmark has measured DeepSeek-R1
  specifically (Jegham et al. 2025, below) — useful background for calibrating the fallback tiers, not a substitute
  for a provider disclosure.
- **Microsoft Copilot, Grok (xAI), Perplexity, Poe, and Character.AI** — no official per-query environmental
  disclosure found for any of them as of this document's last review.

If any of this changes, the affected provider gets a real disclosed profile the same way OpenAI's and Google's did:
built from their own published figure, not an estimate of one.

## Global default assumptions

When no model-specific figure applies, these industry-average-order-of-magnitude defaults are used (all overridable
per-profile, and the carbon intensity is user-overridable in Settings):

| Assumption | Default | Basis |
|---|---|---|
| PUE (Power Usage Effectiveness) | 1.56 | [Uptime Institute Global Data Center Survey 2024](https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024) industry-average PUE |
| Grid carbon intensity | 442 g CO2e/kWh | Order-of-magnitude global average electricity grid intensity ([IEA electricity data](https://www.iea.org/topics/electricity)) |
| WUE (Water Usage Effectiveness) | 1800 mL/kWh | Order-of-magnitude data center site water usage average |

These are broad averages, not measurements of any specific facility. A user who knows their local grid's carbon
intensity can override it in **Settings → Environmental methodology**, which makes CO2e estimates more relevant to
where they actually live.

## Everyday comparisons

`packages/core/src/environment/comparisons.ts` converts energy figures into comparisons like "roughly as much
electricity as running a laptop for X hours." The constants behind these (a ~12 Wh smartphone battery, a ~50 W
laptop draw, a ~9 W LED bulb) are shown as documented, order-of-magnitude assumptions — never as a precise
conversion factor — and the UI always states explicitly that the comparison is approximate.

## Sources & further reading

These are the same citations shown (with links) on the in-app Methodology page, so anyone can check the order of
magnitude for themselves rather than taking this project's word for it:

- Sam Altman, ["The Gentle Singularity"](https://blog.samaltman.com/the-gentle-singularity) (June 2025) — OpenAI's
  own disclosed per-query energy (~0.34 Wh) and water (~0.000085 gal) figures for ChatGPT. Basis for the
  `openai/chatgpt-default` disclosed profile.
- Google, ["Measuring the environmental impact of AI inference"](https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference)
  (Aug 2025), and the full [technical report (PDF)](https://services.google.com/fh/files/misc/measuring_the_environmental_impact_of_delivering_ai_at_google_scale.pdf) —
  Google's disclosed median per-prompt energy (0.24 Wh), water (0.26 mL) and carbon (0.03 g CO2e) for Gemini Apps.
  Basis for the `google/gemini-default` disclosed profile.
- de Vries, A., ["The growing energy footprint of artificial intelligence"](https://doi.org/10.1016/j.joule.2023.09.004),
  *Joule*, Vol. 7, Issue 10 (2023) — peer-reviewed academic estimate of LLM inference energy use, informing the
  fallback tiers' order of magnitude.
- [Uptime Institute Global Data Center Survey 2024](https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024) —
  industry-average PUE.
- [IEA, Electricity](https://www.iea.org/topics/electricity) — order-of-magnitude reference for global average grid
  carbon intensity.
- Mistral AI, ["Our contribution to a global environmental standard for AI"](https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai/)
  (July 2025) — real, ISO-compliant per-response CO2e/water figures for Le Chat; not usable as a disclosed profile
  here because it omits the energy (Wh) figure this engine requires. See "Other providers we checked" above.
- Jegham, N. et al., ["How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference"](https://arxiv.org/abs/2505.09598)
  (2025) — independent academic benchmark covering several models including DeepSeek-R1, informing the fallback
  tiers' order of magnitude for providers with no official disclosure.

## What this deliberately does not do

- **No single universal constant.** There is no one "grams of CO2 per token" number anywhere in this codebase.
- **No false precision.** The UI formatting layer (`packages/extension/src/ui/format.ts`) rounds every figure to at
  most 1–2 significant decimal digits — "1.2 kg CO2e", never "1.23749281 kg CO2e".
- **No silent confidence inflation.** Confidence is always exactly one of `"high"` | `"medium"` | `"low"`, driven by
  the underlying profile, and shown next to every aggregate figure in the Methodology page.
- **No pretending to track model versions.** Providers rename and replace flagship models faster than this project
  can verify; profiles describe disclosure dates and detected mode/model-name keywords, not a promise to recognize
  every current or future model release by name.
