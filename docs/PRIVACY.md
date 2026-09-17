# Privacy architecture

This is the same content shown in the extension's own Privacy page (`packages/extension/src/ui/pages/PrivacyPage.tsx`),
with more implementation detail on how each guarantee is actually enforced in code, not just stated as policy.

## What is never collected

- Prompts or responses (the actual conversation content)
- Screenshots or page content beyond a momentary rendered-text-length measurement
- Cookies or authentication tokens
- Any personally identifiable information
- Any data at all sent to an AI Footprint server — because none exists

## What is accessed, and why

On pages belonging to AI products a user has explicitly enabled (see onboarding / Settings → Providers), the content
script observes DOM mutations to detect when a new message has finished rendering, and reads that element's
`textContent.length` to estimate a token count. The string itself is never stored, logged, or forwarded — only the
resulting numbers cross into extension messaging.

Concretely, the only thing sent from a content script to the background service worker is:

```ts
{
  provider: string;   // e.g. "chatgpt" — a fixed id from the provider registry
  model: string;       // a short model label read from page chrome, capped at 128 chars
  inputTokens: number;
  outputTokens: number;
  tokenMethod: "exact" | "estimated" | "inferred";
  timestamp?: number;
}
```

## What is stored, exactly

A `UsageEvent` (`packages/core/src/types.ts`) contains only:

```
id, provider, model, timestamp,
inputTokens, outputTokens, totalTokens, tokenMethod,
energyWh, energyWhRange, co2eGrams, waterMl,
confidence, profileId
```

This is enforced in code in three separate places, not just documented:

1. **`validateUsageEventCandidate`** (`core/src/events/validate.ts`) rejects any message crossing the content
   script → background boundary that has an unrecognized field, an unknown provider id, a negative/non-finite/
   absurdly large token count, or an implausible timestamp — before anything is built or stored.
2. **`assertPrivacySafe`** (`core/src/privacy/guard.ts`) is called on every event immediately before it's written to
   storage (both in the in-memory reference `StorageAdapter` used by tests and in the real
   `WebExtensionStorageAdapter`). It throws if the object has any field outside `UsageEvent`'s exact allow-list, or
   if any string field (`id`/`provider`/`model`/`tokenMethod`/`confidence`/`profileId`) is longer than 128
   characters — a length no legitimate value in this schema should ever reach, but that leaked conversation text
   almost certainly would.
3. **`exportEventsAsCSV`/`parseImportedJSON`** reuse the same allow-list, so even a hand-edited import file is
   checked against the same rules before it's accepted.

See `packages/core/tests/storage.test.ts` and `packages/extension/tests/webextensionStorage.test.ts` for the tests
that exercise all three of these guarantees, including a test that a tampered payload with an extra `text` field is
rejected end-to-end.

## Permissions

The manifest requests:

- `storage` — to persist usage data locally
- `alarms` — reserved for potential future local scheduling (e.g. a weekly summary notification); nothing currently
  uses it beyond the notification preference toggle in Settings
- `host_permissions` scoped to exactly the domains in the provider registry — never `<all_urls>`

Content scripts are declared with `matches` scoped to those same domains, so the extension's code simply does not run
on any other website. There is no `externally_connectable` configuration, so arbitrary web pages cannot send messages
into the extension's background service worker even if they wanted to — only the extension's own content scripts can.

## No account, no sync, no analytics

- There is no sign-in flow anywhere in the product.
- There is no analytics or telemetry library included, and no network requests are made by the extension at all in
  this version.
- Optional cloud synchronization does not exist yet. If it is built in the future, it will be a separate, off-by-
  default feature requiring explicit opt-in before any data leaves the device — see the "Optional future cloud sync"
  section on the in-app Privacy page.

## Data control

Users can, at any time, from Settings:

- Export all data as JSON or CSV
- Import a previously-exported JSON file
- Permanently delete all locally stored data (with an explicit confirmation step)
- Disable monitoring for any individual provider
