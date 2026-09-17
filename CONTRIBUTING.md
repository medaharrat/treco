# Contributing to Treco

Thanks for considering contributing — Treco is a free, open-source, non-commercial project maintained in personal
time, and outside contributions are genuinely welcome: bug fixes, new provider adapters, documentation, tests,
anything.

## Before you start

For anything beyond a small fix (a new feature, a significant refactor, a new provider), please open an issue first
to discuss the approach. It saves everyone time if a PR turns out to be off-track.

## Project setup

Requires Node 18+.

```bash
git clone https://github.com/medaharrat/treco.git
cd treco
npm install
npm run build:core   # the extension imports core's built dist/ output
npm run dev           # watches and rebuilds the Chrome build into packages/extension/dist/chrome
```

Load `packages/extension/dist/chrome` as an unpacked extension to try your changes (see the README's
"Installing in a browser" section).

## Before opening a PR

Run the full check suite locally — this is exactly what CI runs:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

All four must pass. `npm test` includes the security/privacy invariant suite (see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)) — if your change touches the background service worker, storage, or
message validation, make sure you understand why those tests exist before changing them.

## Adding a new AI provider

This is the most common kind of contribution. It touches exactly these places, and nothing else:

1. `packages/core/src/providers/registry.ts` — add a `ProviderDefinition` entry (id, name, domains, color, etc).
2. `packages/core/src/environment/modelProfiles.ts` — add model-specific footprint coefficients if you have a
   credible source for them, or rely on the existing fallback tier if you don't.
3. `packages/extension/src/adapters/providers/<id>.ts` — a small config object passed to `createDomAdapter(...)`
   with the provider's DOM selectors.
4. `packages/extension/src/adapters/registry.ts` — one line adding your adapter to `ALL_ADAPTERS`.
5. A fixture (`packages/extension/tests/fixtures/<id>.html`) and a compatibility-suite entry
   (`packages/extension/tests/providerCompatibility.ts` / `adapters.test.ts`) so your adapter gets the same test
   coverage every other provider gets automatically.

Selectors are a best-effort first line of defense — every adapter also falls back to a structure-agnostic heuristic
when selectors go stale, so it's fine if your selectors aren't perfect on day one.

## Code style

- TypeScript strict mode; no `any` without a very good reason.
- No comments explaining *what* code does — only *why*, when it's genuinely non-obvious (a workaround, a subtle
  invariant, a hidden constraint).
- Match the existing code's restraint: no new abstractions, dependencies, or "might be useful later" additions
  without discussing them first — see `docs/ARCHITECTURE.md`'s design goals.
- ESLint (`npm run lint`) must pass with zero warnings.

## Privacy and security invariants

Treco's core promise is "no network requests, local-only storage, conversation content never persisted or
transmitted." Any change that touches `packages/extension/src/content`, `packages/extension/src/background`,
`packages/core/src/privacy`, or `packages/core/src/storage` will be held to that standard specifically — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the exact enforcement points, and don't weaken
`assertPrivacySafe`, `validateUsageEventCandidate`, or the no-network-code test suite without a very clear reason
discussed in the PR.

Found an actual security/privacy vulnerability instead of a normal bug? Please see [`SECURITY.md`](SECURITY.md)
rather than opening a public issue or PR.

## Commit messages

Plain, descriptive, present-tense ("add Mistral adapter", not "added" or "adds"). No strict format is enforced.

## License

By contributing, you agree that your contribution is licensed under the project's [MIT License](LICENSE).

## Code of conduct

Participation in this project is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
