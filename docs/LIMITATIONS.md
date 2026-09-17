# Limitations

An honest account of what AI Footprint cannot actually know, and why — assessed against what a browser extension can
realistically observe, before any of this was implemented.

## Structural limitations, true for every provider

- **No browser extension can see a provider's real tokenizer output.** Consumer web chat UIs (as opposed to API
  playgrounds with a "usage" panel) do not expose exact input/output token counts in the DOM or in network responses
  visible to page-level JavaScript in the general case. Every count this extension produces is therefore an estimate
  or, in the worst case, a coarse inferred default — never a number pulled from the provider's own accounting. The
  `tokenMethod` field (`"exact" | "estimated" | "inferred"`) exists precisely so the UI never blurs this distinction.
- **Hidden reasoning/chain-of-thought tokens are invisible.** Models that do extended internal reasoning before
  producing a visible response (OpenAI's o1/o3-class models, DeepSeek's reasoner mode, and similar) may consume
  substantially more compute than their visible output length suggests. This extension routes such models to a
  higher, wider-uncertainty-band fallback tier, but this is a coarse correction, not a measurement — see
  `docs/METHODOLOGY.md`.
- **No visibility into actual hardware, data center, or energy mix.** Energy/CO2e/water figures rely on published,
  order-of-magnitude industry assumptions (PUE, grid carbon intensity, WUE) and, where available, provider-disclosed
  aggregate averages — never a measurement of the specific server that handled a specific request.
- **DOM-based observation is inherently fragile.** Every provider's web app can change its markup at any time without
  notice. The adapter architecture's generic fallback (see `docs/ARCHITECTURE.md`) keeps the extension producing
  *some* honestly-labeled estimate rather than nothing when this happens, but a redesign can still degrade a
  provider from a real input/output split (`"estimated"`) to a coarser combined estimate (`"inferred"`) until the
  adapter's selectors are updated.
- **Multimodal input/output (images, audio, video, file attachments) is not separately modeled.** Token/energy
  estimates are based on rendered text length only; a conversation involving image generation or large file uploads
  will likely be understated.

## Per-provider notes

| Provider | What's realistically observable | Notes |
|---|---|---|
| ChatGPT | Structured DOM (`data-message-author-role`) is a comparatively stable, if undocumented, convention | Uses OpenAI's disclosed per-query energy/water figures for the default model; o1/o3-class reasoning models fall back to the reasoning tier instead |
| Claude | Structured DOM via `data-testid` attributes, a common but undocumented Anthropic web client convention | No public per-query disclosure found; uses fallback tiers by model name (haiku/sonnet/opus) |
| Gemini | Google's Angular-based client uses heavily obfuscated class names; structured selectors are lower-confidence here than most other providers | Uses Google's disclosed per-prompt energy/water/carbon figures for the default model; leans more on the generic fallback in practice |
| Microsoft Copilot | No documented stable message attributes found | Expected to rely primarily on the generic quiet-period fallback; fallback tier only |
| DeepSeek | Class-name-based selectors, lower confidence | Reasoning-mode responses route to the reasoning tier |
| Perplexity | Mixes generated text with search-result citations in the same view, which can inflate the measured response length | Fallback tier only |
| Grok | Also embedded inside x.com's much larger unrelated app; the adapter scopes its generic fallback to the narrowest container it can find to avoid picking up unrelated timeline content | Fallback tier only |
| Le Chat (Mistral) | Class/attribute-based selectors, lower confidence | Fallback tier only |
| Poe | Hosts many different underlying models under one UI; the model name shown in page chrome is used as-is | Tier assignment depends on how well the displayed bot name matches known keywords |
| Character.AI | Persona-driven roleplay chat, generally shorter and more frequent turns than assistant-style chat | Fallback tier only |

## Safari

Safari can run WebExtensions, but converting and signing one requires macOS, Xcode, and an Apple Developer account —
none of which exist in this repository's build/CI environment. The codebase deliberately avoids Chromium-only or
Firefox-only APIs so that `xcrun safari-web-extension-converter` against the Chrome build remains the intended path,
but this has not been (and could not be) verified end-to-end here. Treat Safari support as "architecturally intended,
not verified."

## What was intentionally not built

- **No attempt to intercept/parse network responses for hidden usage metadata.** While some providers' network
  traffic might contain more granular data, parsing it would mean the content script reading substantially more of
  each request/response than a rendered-text-length measurement requires — a larger privacy surface for a marginal
  accuracy gain the providers themselves haven't made a stable, documented contract. The DOM-observation approach was
  chosen specifically because it needs to look at less.
- **No cross-device sync, no account system, no cloud backend.** Not a limitation to fix later so much as a
  deliberate scope boundary for this version — see `docs/PRIVACY.md`.
- **No attempt to fingerprint or distinguish models the provider itself doesn't clearly label in its UI.** If a
  provider doesn't show which model handled a response, this extension shows the provider's default label rather
  than guessing.
