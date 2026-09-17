# Architecture

## Design goals

1. **No provider-specific code outside a narrow adapter layer.** Everything that knows about ChatGPT's DOM structure
   lives in one small file; everything else — token estimation, environmental math, storage, aggregation, the UI —
   is provider-agnostic and driven by data (`packages/core/src/providers/registry.ts`).
2. **A single trust boundary for writes.** The background service worker is the only place a `UsageEvent` is ever
   constructed and persisted. Content scripts send small, validated *candidates* (numbers and short ids only); the
   background independently re-validates and recomputes the environmental figures rather than trusting anything
   computed on the page side.
3. **Everything works offline, with no account.** There is no backend. `packages/core` has zero dependency on
   `chrome.*`/`browser.*`, so its logic is fully unit-testable in plain Node and could theoretically back a different
   host (a future companion app, for instance) without change.

## Data flow

```
Provider web page (e.g. chat.openai.com)
        │  DOM mutations (new message rendered)
        ▼
Content script (isolated world)
  - adapters/registry.ts picks the matching AIProviderAdapter by hostname
  - adapter.observe() debounces streaming, measures rendered text LENGTH only
  - core.estimateTokensFromText() turns that length into a token estimate
  - the text itself is never stored or forwarded anywhere
        │  runtime.sendMessage({ type: "aifootprint/usage-candidate", payload })
        │  payload = { provider, model, inputTokens, outputTokens, tokenMethod, timestamp }
        ▼
Background service worker (the trust boundary)
  - validateUsageEventCandidate() strictly re-validates the message
    (rejects unknown providers, extra fields, out-of-range/negative/NaN numbers,
     implausible timestamps)
  - checks the provider is actually enabled in settings
  - buildUsageEvent() independently resolves a ModelFootprintProfile and computes
    energy/CO2e/water — the background never trusts figures from the content script
  - storage.addEvent() persists the resulting UsageEvent via browser.storage.local,
    itself re-checked against assertPrivacySafe()'s field allow-list
        │  browser.storage.onChanged fires
        ▼
Popup / Dashboard (React, reads storage directly)
  - StorageContext subscribes to storage.onChanged and re-reads events/settings/goals
  - packages/core/src/aggregation, insights, goals compute everything the UI shows,
    purely from the stored UsageEvent[] — no separate cache to keep in sync
```

## Module responsibilities

| Module | Responsibility | Depends on browser APIs? |
|---|---|---|
| `core/providers` | Registry of supported providers (id, domains, display metadata) | No |
| `core/tokens` | Heuristic token estimation from text/length | No |
| `core/environment` | Model profile database + the tokens→energy→CO2e/water calculation | No |
| `core/events` | Candidate validation + `UsageEvent` construction | No |
| `core/storage` | `StorageAdapter` interface, in-memory reference implementation, export/import | No |
| `core/aggregation` | Period stats, time series bucketing, streaks | No |
| `core/insights` | Neutral-language insight generation from aggregated data | No |
| `core/goals` | Goal progress calculation | No |
| `core/privacy` | Runtime field allow-list guard (`assertPrivacySafe`) | No |
| `extension/platform` | `browser.*` abstraction (webextension-polyfill), storage impl, typed messaging | Yes |
| `extension/adapters/shared` | Generic, selector-agnostic DOM observation factory | Yes (DOM) |
| `extension/adapters/providers` | Per-provider selector configs (the *only* provider-specific code) | Yes (DOM) |
| `extension/background` | Message validation, event construction, storage writes | Yes |
| `extension/content` | Wires the matching adapter to the messaging layer | Yes |
| `extension/ui` | React dashboard/popup | Yes (storage reads) |

## Why content scripts don't touch storage directly

Content scripts run on third-party pages. Even though `browser.storage.local` is available to them under the
extension's permissions, routing every write through the background service worker means there is exactly one place
in the codebase that decides what gets persisted, and that place re-validates from scratch. A bug or future change in
an adapter can at worst send a malformed *candidate* message, which the background will simply reject — it can never
directly corrupt or bypass the storage layer's field allow-list.

## Adapter resilience strategy

Consumer AI web apps change their markup without notice and without a public API contract. Every adapter therefore
has two tiers (see `extension/src/adapters/shared/domAdapterFactory.ts`):

1. **Structured tier**: configured CSS selectors identify individual user/assistant message elements, giving a real
   input/output token split, tagged `"estimated"`.
2. **Generic fallback tier**: if no structured selectors are configured, or they match nothing (e.g. after a site
   redesign), the adapter instead measures total text growth in the conversation container over a "quiet period" and
   attributes the whole delta to output tokens with a small fixed input estimate, tagged `"inferred"`.

This means an adapter degrades gracefully instead of going silent when a provider changes its UI, and the UI always
shows which tier produced a given number.

## Cross-browser strategy

- **Manifest V3** everywhere, generated per-target by `scripts/write-manifest.mjs` from the same provider registry.
- Chrome/Edge/Brave/Opera use an MV3 `service_worker` background; Firefox uses MV3 `background.scripts` (Firefox's
  event-page model), selected via the `--mode firefox` Vite build.
- All browser API calls go through `webextension-polyfill` via `extension/src/platform/browserApi.ts`, so the rest of
  the codebase only ever sees the promise-based `browser.*` API, not `chrome.*` callbacks.
- The content script is built as a dependency-free IIFE (see `vite.content.config.ts`) rather than an ES module,
  since manifest-declared content scripts cannot reliably use `import`/`export` across every supported browser.
