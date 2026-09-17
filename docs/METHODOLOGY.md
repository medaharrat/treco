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

Extended-reasoning variants (OpenAI's o1/o3-class models, and any model whose name suggests hidden chain-of-thought
generation) are deliberately **excluded** from these disclosed profiles and routed to the generic `"reasoning"`
fallback tier instead — see `resolveProfile.ts`. A provider's published average for its default chat model does not
represent a model that may generate many times more hidden reasoning tokens per visible response.

### 2. Fallback tiers (confidence: `"low"`, always `isFallback: true`)

Used for every provider/model without a credible public disclosure — which, honestly, is most of them. Models are
sorted into one of four broad tiers by simple keyword matching on the model name:

- **small** — compact/"mini"/"flash"/"haiku"-class models
- **medium** — a provider's general-purpose default chat model
- **large** — flagship/"opus"/"ultra"-class models
- **reasoning** — models producing substantial hidden chain-of-thought tokens

Each tier has its own per-token energy coefficients (output always weighted higher than input, since generation
dominates inference cost), a wide uncertainty band (0.4×–2.5×), and an explicit note explaining what it's applied to
and why. This is intentionally never a single number: see `packages/core/tests/environment.test.ts` for a test that
asserts no fallback profile is ever presented at `"high"` confidence, and that output coefficients are never lower
than input coefficients.

## Global default assumptions

When no model-specific figure applies, these industry-average-order-of-magnitude defaults are used (all overridable
per-profile, and the carbon intensity is user-overridable in Settings):

| Assumption | Default | Basis |
|---|---|---|
| PUE (Power Usage Effectiveness) | 1.5 | Order-of-magnitude global data center average |
| Grid carbon intensity | 442 g CO2e/kWh | Order-of-magnitude global average electricity grid intensity |
| WUE (Water Usage Effectiveness) | 1800 mL/kWh | Order-of-magnitude data center site water usage average |

These are broad averages, not measurements of any specific facility. A user who knows their local grid's carbon
intensity can override it in **Settings → Environmental methodology**, which makes CO2e estimates more relevant to
where they actually live.

## Everyday comparisons

`packages/core/src/environment/comparisons.ts` converts energy figures into comparisons like "roughly as much
electricity as running a laptop for X hours." The constants behind these (a ~12 Wh smartphone battery, a ~50 W
laptop draw, a ~9 W LED bulb) are shown as documented, order-of-magnitude assumptions — never as a precise
conversion factor — and the UI always states explicitly that the comparison is approximate.

## What this deliberately does not do

- **No single universal constant.** There is no one "grams of CO2 per token" number anywhere in this codebase.
- **No false precision.** The UI formatting layer (`packages/extension/src/ui/format.ts`) rounds every figure to at
  most 1–2 significant decimal digits — "1.2 kg CO2e", never "1.23749281 kg CO2e".
- **No silent confidence inflation.** Confidence is always exactly one of `"high"` | `"medium"` | `"low"`, driven by
  the underlying profile, and shown next to every aggregate figure in the Methodology page.
