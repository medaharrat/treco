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
Content script (isolated world, one instance per matching tab)
  - adapters/registry.ts picks the matching AIProviderAdapter by hostname
    (adapter.detect() only ever returns true for that adapter's own registered
     domains — see "Provider isolation" below)
  - adapter.observe() reads the relevant DOM node's rendered text transiently,
    in-memory, purely to compute a character/token count
  - core.estimateTokensFromText() turns that text into a numeric token estimate
    and returns only numbers — this is the last point in the pipeline where the
    actual page text exists anywhere; nothing downstream of this call ever sees
    the text itself, only the resulting counts
  - the candidate object sent onward contains only {provider, model, inputTokens,
    outputTokens, tokenMethod, timestamp} — no text field exists on this type,
    so there is nothing to smuggle a leak through even by mistake
        │  runtime.sendMessage({ type: "aifootprint/usage-candidate", payload })
        ▼
Background service worker (the trust boundary)
  - validateUsageEventCandidate() strictly re-validates the message against an
    allow-list schema (rejects unknown providers, extra fields, wrong types,
    out-of-range/negative/NaN numbers, implausible timestamps)
  - cross-checks the sender's actual tab URL against the claimed provider's
    registered domain (getProviderByDomain) — a message can't be attributed to
    a provider it didn't actually come from
  - checks the provider is actually enabled in settings
  - buildUsageEvent() independently resolves a ModelFootprintProfile and computes
    energy/CO2e/water — the background never trusts figures from the content script
  - storage.addEvent() persists the resulting UsageEvent via browser.storage.local,
    itself re-checked field-by-field (type and range, not just key names) against
    assertPrivacySafe()'s allow-list
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

## Provider isolation

Each provider adapter is restricted to its own domain(s) in two independent layers:

1. **Manifest-level:** `content_scripts.matches`/`host_permissions` are generated from the same
   `PROVIDER_REGISTRY` (`scripts/write-manifest.mjs`), so the browser itself only ever injects the content script into
   pages on the supported provider domains — it cannot run anywhere else.
2. **Application-level:** `adapters/registry.ts` picks an adapter via `adapter.detect()`, which checks
   `location.hostname` against that specific adapter's own `domains` list. `PROVIDER_REGISTRY` also guarantees each
   domain maps to exactly one provider (`getProviderByDomain`), and the background service worker cross-checks a
   message's claimed provider against the sender's actual domain before ever recording it.

No provider adapter can be triggered by, or misattributed to, another provider's traffic. This is covered by
automated tests (`packages/extension/tests/security.test.ts`, `backgroundSecurity.test.ts`).

## Security invariants and how they're enforced

| Property | Enforced by |
|---|---|
| No network requests anywhere in the codebase | Automated source-scan test + built-bundle scan for `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`/`eval`/`new Function` |
| No remote/dynamically-downloaded code | Manifest V3 default sandboxing + an explicit `content_security_policy` (`script-src 'self'; object-src 'self'`) generated into every build |
| Conversation text can't reach storage | `UsageEventCandidate` has no text field at the type level; `validateUsageEventCandidate` and `assertPrivacySafe` both reject unexpected fields and implausibly long strings |
| Only the approved schema is ever stored | `assertPrivacySafe` type- and range-checks every field on every write (`storage.addEvent`, `replaceAllEvents`) and on every import |
| Minimal permissions | Manifest requests only `storage`; no `alarms`, `tabs`, `history`, `cookies`, `debugger`, `webRequest`, `webNavigation`, `downloads`, `management`, or `<all_urls>` |
| Provider isolation | Manifest host restrictions + `adapter.detect()` + background sender-domain cross-check (see above) |
| Imports can't smuggle oversized or malformed data | `parseImportedJSON` caps raw text size and event count before parsing, then validates every event |
| CSV exports can't execute as spreadsheet formulas | `exportEventsAsCSV` prefixes any cell starting with `=`, `+`, `-`, `@`, tab, or CR with a neutralizing quote |

Run `npm test` to execute this invariant suite alongside the rest of the tests; run `npm run build && npm test` to
additionally have it inspect the actual built extension bundle rather than only the source.

## Cross-browser strategy

- **Manifest V3** everywhere, generated per-target by `scripts/write-manifest.mjs` from the same provider registry.
- Chrome/Edge/Brave/Opera use an MV3 `service_worker` background; Firefox uses MV3 `background.scripts` (Firefox's
  event-page model), selected via the `--mode firefox` Vite build.
- All browser API calls go through `webextension-polyfill` via `extension/src/platform/browserApi.ts`, so the rest of
  the codebase only ever sees the promise-based `browser.*` API, not `chrome.*` callbacks.
- The content script is built as a dependency-free IIFE (see `vite.content.config.ts`) rather than an ES module,
  since manifest-declared content scripts cannot reliably use `import`/`export` across every supported browser.
- Vite's default "modulepreload" polyfill (which calls `fetch()` to warm the cache for chunk dependencies) is
  disabled (`build.modulePreload: false` in `vite.config.ts`) - Treco doesn't need that optimization inside an
  extension page, and disabling it means the built output contains zero calls to `fetch` anywhere, not just in
  Treco's own code.

## Store compatibility notes

- **Chrome, Edge, Brave, Opera**: all Chromium-based and MV3-compatible; built from the same `chrome` target.
- **Firefox**: MV3 with an event-page-style background (`background.scripts`, not `service_worker`), built via the
  `firefox` target. The `browser_specific_settings.gecko.id` in that manifest is currently a placeholder
  (`ai-footprint@example.invalid`) and should be replaced with a real add-on ID before submission.
- **Safari**: WebExtensions support requires converting the `chrome` build with Xcode's
  `xcrun safari-web-extension-converter`, then signing/notarizing through an Apple Developer account - neither of
  which is available in this repository's build environment. The codebase deliberately avoids Chromium- or
  Firefox-only APIs so that conversion path stays viable; see `docs/LIMITATIONS.md`.
- None of the store review guidelines for any of these browsers require broader permissions than Treco already
  requests (`storage`, and host access to the specific supported AI domains) - the minimal permission set
  is itself a compatibility advantage, since overly broad permissions are a common cause of store review friction.
