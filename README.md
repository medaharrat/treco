<p align="center">
  <img src="packages/extension/public/icons/icon-128.png" width="88" height="88" alt="Treco logo" />
</p>

# Treco — Sustainable AI Usage Tracking

[![CI](https://github.com/medaharrat/treco/actions/workflows/ci.yml/badge.svg)](https://github.com/medaharrat/treco/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2ea44f)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](#development)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](#development)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)](#installing-in-a-browser)
[![Privacy](https://img.shields.io/badge/privacy-local--only-2ea44f)](docs/PRIVACY.md)
[![Providers](https://img.shields.io/badge/providers-10%20supported-orange)](#what-it-does)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

`ai` · `sustainability` · `browser-extension` · `privacy` · `carbon-footprint` · `chatgpt` · `claude` · `gemini` · `typescript` · `react`

Treco is a privacy-first, cross-browser extension that helps you understand how much you use AI, and gives you a
clearly-labeled **estimate** of the energy, CO2e and water associated with that usage — entirely on your device, with
no account, no server, and no conversation content ever collected.

> **Honesty first.** Every number this extension shows is an estimate, built from published research and
> provider-disclosed figures where they exist, and clearly-labeled fallback tiers where they don't. Nothing is
> presented as an exact measurement. See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) for the full calculation and
> [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) for what this product deliberately does not claim to know.

## What it does

- Detects when you use a supported AI web app (ChatGPT, Claude, Gemini, Microsoft Copilot, DeepSeek, Perplexity, Grok,
  Mistral's Le Chat, Poe, Character.AI) and estimates the tokens involved in each interaction.
- Converts those tokens into an estimated energy, CO2e and water footprint using a documented, per-model calculation
  engine — never a single hardcoded "grams of CO2 per token" constant.
- Shows a polished dashboard: today/week/month/all-time summaries, a timeline, provider and model breakdowns, plain-
  language insights, optional personal goals, and full settings/export/delete controls.
- Runs entirely locally. There is no backend. Nothing about your usage ever leaves your device.

## What it does not do

- It does not read, store, or transmit your prompts or the AI's responses.
- It does not require an account or any personal information.
- It does not include analytics or telemetry by default.
- It does not claim precise token counts or precise environmental measurements — see the confidence/method labels
  shown next to every figure in the UI.

Full detail: [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Security & Privacy

Treco is open source, free, and built around a small, verifiable set of properties rather than a promise to "trust
us":

- **Open source.** The full source is in this repository - nothing runs that you can't read.
- **Free.** No paid tier, no subscription, no advertising.
- **No backend.** Treco has no server of any kind, and never has.
- **No network requests.** The extension makes zero outbound network calls - no analytics, no telemetry, no remote
  config. This is enforced by an automated test that scans both the source and the built extension bundle for
  network-capable code (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `eval`) and fails if any appear.
- **Local-only storage.** All usage data, settings, and goals live in your browser's local extension storage, on your
  device. Nothing syncs, nothing uploads.
- **Conversation content is not persisted or transmitted.** Estimating token counts requires the content script to
  transiently read rendered text on a supported AI page - see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for
  exactly where that text is read and where the pipeline reduces it to numbers only. Only structured usage metadata
  (provider, model, token counts, timestamp, estimated energy/CO2e/water) is ever stored, enforced by a runtime
  allow-list guard that rejects any unexpected field or implausibly long string before it can be written.
- **Minimal permissions.** The manifest requests only `storage`, plus host access restricted to the
  specific supported AI provider domains (Settings → Providers) - nothing broader.

See [`SECURITY.md`](SECURITY.md) for how to report a vulnerability, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical detail behind every claim above.

## Project structure

```
treco/
├── packages/
│   ├── core/                 Shared, browser-agnostic TypeScript logic
│   │   └── src/
│   │       ├── types.ts              Core data model (UsageEvent, ModelFootprintProfile, ...)
│   │       ├── providers/            Provider registry (data only)
│   │       ├── tokens/                Token estimation engine
│   │       ├── environment/          Environmental impact engine + model profile database
│   │       ├── events/               Candidate validation + UsageEvent construction
│   │       ├── storage/              StorageAdapter interface, in-memory impl, export/import
│   │       ├── aggregation/          Period stats, time series, streaks
│   │       ├── insights/             Neutral-language insight generation
│   │       ├── goals/                Goal progress tracking
│   │       └── privacy/              Runtime privacy guardrails
│   │
│   └── extension/            The WebExtension itself
│       └── src/
│           ├── background/           Service worker: the one trust boundary for storage writes
│           ├── content/              Content script entry point
│           ├── adapters/             Provider adapter implementations (DOM observation)
│           │   ├── shared/           Generic, selector-agnostic adapter factory
│           │   └── providers/        One small config file per provider
│           ├── platform/             browser.* abstraction (webextension-polyfill), storage, messaging
│           └── ui/                   React app (dashboard + popup), pages, components, hooks
│
└── docs/                      Architecture, privacy, methodology and limitations documentation
```

## Architecture

```
Extension
│
├── Background Service Worker      ← single trust boundary; validates + recomputes every event
│
├── Content Scripts (one per provider domain, sharing one generic adapter factory)
│   ├── ChatGPT adapter
│   ├── Claude adapter
│   ├── Gemini adapter
│   ├── Copilot adapter
│   ├── DeepSeek adapter
│   ├── Perplexity adapter
│   ├── Grok adapter
│   ├── Le Chat (Mistral) adapter
│   ├── Poe adapter
│   └── Character.AI adapter
│
├── Provider Detection             (packages/core/src/providers)
├── Usage Event Engine             (packages/core/src/events)
├── Token Estimation Engine        (packages/core/src/tokens)
├── Environmental Impact Engine    (packages/core/src/environment)
├── Local Storage                  (packages/core/src/storage + packages/extension/src/platform/storage.ts)
└── React Dashboard                (packages/extension/src/ui)
```

Every provider adapter implements the same interface:

```ts
interface AIProviderAdapter {
  id: string;
  name: string;
  domains: string[];
  detect(): boolean;
  observe(emit: (event: UsageEvent | null) => void): void;
  disconnect(): void;
  extractUsage(): UsageEvent | null; // one-shot, used by tests against static fixtures
}
```

Adding a new provider means: one entry in `packages/core/src/providers/registry.ts`, one small config object passed
to `createDomAdapter(...)` in `packages/extension/src/adapters/providers/`, one line in the adapter registry, and one
fixture + compatibility-suite entry in the test files — nothing else in the codebase changes. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full data flow and trust boundaries.

## Development

Requires Node 18+.

```bash
npm install
npm run build:core   # build the shared core package first (the extension imports its dist/ output)
npm run dev           # watches and rebuilds the Chrome/MV3 build into packages/extension/dist/chrome
```

Then load `packages/extension/dist/chrome` as an unpacked extension (see **Installing in a browser** below) and
reload the extension after each rebuild — WebExtensions don't support hot module reloading.

### Testing

```bash
npm test              # runs both packages' vitest suites
npm run typecheck     # strict TypeScript across both packages
```

Core has 80+ unit tests covering token estimation, the environmental calculation engine, aggregation/time-series math,
event validation, storage, privacy guardrails, insights and goals - including a dedicated `security.test.ts` suite
per package that verifies the no-network, strict-schema, and provider-isolation invariants described in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The extension package has a fixture-driven compatibility suite
(`packages/extension/tests/`) that exercises every provider adapter against a mock HTML fixture, plus a reusable
`runProviderCompatibilitySuite(...)` helper so a newly added provider is held to the exact same checks automatically.

Run `npm run build && npm test` (rather than just `npm test`) to also have the security suite inspect the actual
built extension bundle and manifest, not just the source.

### CI and code-quality scanning

Every push/PR to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): typecheck, lint, both build
targets, and the full test suite (including the security invariant suite against the freshly built extension).

Two additional, optional scans are wired in but require a repository secret to actually run — each is skipped
(not failed) if its secret isn't configured:

- [`.github/workflows/snyk.yml`](.github/workflows/snyk.yml) — dependency vulnerability scanning via
  [Snyk](https://snyk.io). Requires a `SNYK_TOKEN` repo secret.
- [`.github/workflows/sonarcloud.yml`](.github/workflows/sonarcloud.yml) — static analysis via
  [SonarCloud](https://sonarcloud.io). Requires a `SONAR_TOKEN` repo secret, and expects the project
  key/organization in [`sonar-project.properties`](sonar-project.properties) to match a SonarCloud project actually
  created for this repo.

### Building for production

```bash
npm run build           # Chrome / Edge / Brave / Opera (Manifest V3) → packages/extension/dist/chrome
npm run build:firefox   # Firefox (Manifest V3, event-page background) → packages/extension/dist/firefox
```

The manifest is generated from the shared provider registry (`scripts/write-manifest.mjs`), so host permissions and
content script matches can never drift out of sync with the adapters that actually exist.

**Verifying a build.** Anyone can reproduce what's distributed by cloning this repository at a given commit/tag and
running the commands above - there's no separate private build step or asset injected outside this source tree. This
is not a claim of byte-for-byte reproducible builds (dependency resolution and toolchain versions can shift output
slightly over time); it means the process is: *this source → this build command → this artifact*, with nothing
hidden in between. To sanity-check a published build against source, rebuild from the matching tag and diff
`packages/extension/dist/chrome` against the unpacked contents of the published `.zip`/`.crx`.

## Installing in a browser

**Chrome / Edge / Brave / Opera** (all Chromium-based, Manifest V3):

1. Run `npm run build`.
2. Go to `chrome://extensions` (or the equivalent `edge://extensions`, `brave://extensions`, `opera://extensions`).
3. Enable "Developer mode".
4. Click "Load unpacked" and select `packages/extension/dist/chrome`.

**Firefox**:

1. Run `npm run build:firefox`.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on…" and select `packages/extension/dist/firefox/manifest.json`.
4. Temporary add-ons are removed when Firefox restarts; for a persistent install, the built `dist/firefox` directory
   needs to be signed and published through Mozilla's add-on process.

**Safari**: Safari can run WebExtensions via Xcode's "Convert to Safari Extension" tooling
(`xcrun safari-web-extension-converter`) against the `dist/chrome` build, but this requires macOS, Xcode, and an Apple
Developer account to actually run/sign, none of which are available in this repository's build environment. The
codebase avoids any Chromium- or Firefox-only APIs specifically so that conversion path stays viable; see
[`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) for detail.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — data flow, trust boundaries, module responsibilities
- [`docs/PRIVACY.md`](docs/PRIVACY.md) — exactly what is and isn't collected, and how that's enforced in code
- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) — the environmental calculation engine, assumptions and sources
- [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) — what this extension honestly cannot know, per provider

## Contributing

Treco is open source and welcomes contributions — bug fixes, new provider adapters, documentation, anything. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for how to set up the project, the checks a PR needs to pass, and the general
workflow. Everyone participating is expected to follow the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Found a security or privacy issue instead? Please see [`SECURITY.md`](SECURITY.md) rather than opening a public issue.

## License

MIT — see [`LICENSE`](LICENSE). Third-party dependency licenses are listed on the in-extension Open Source page
(Settings → Legal & Support → Open Source).
