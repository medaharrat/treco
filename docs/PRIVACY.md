# Privacy architecture

This is the same content shown in the extension's own Privacy page (`packages/extension/src/ui/pages/PrivacyPage.tsx`),
with more implementation detail on how each guarantee is actually enforced in code, not just stated as policy.

## What is never collected

- Prompts or responses (the actual conversation content) as persisted or transmitted data
- Screenshots
- Cookies or authentication tokens
- Any personally identifiable information
- Any data at all sent to a Treco server — because none exists

## What is accessed, and why

On pages belonging to AI products a user has explicitly enabled (see onboarding / Settings → Providers), the content
script observes DOM mutations to detect when a new message has finished rendering. To be precise rather than
reassuring-but-vague: it reads that element's actual rendered text (`node.textContent`) — not merely its length — and
passes it to `estimateTokensFromText()`, which measures both character length and word count (splitting on
whitespace) to produce a token estimate, since that heuristic is more accurate than length alone. That function takes
the string only as a transient argument and returns nothing but numbers (`{ tokens, range, method }`); the string
itself is never stored, logged, or forwarded anywhere — only the resulting numeric estimate crosses into extension
messaging. See `packages/core/src/tokens/estimate.ts` for the exact implementation.

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
- `host_permissions` scoped to exactly the domains in the provider registry — never `<all_urls>`

No other permission is requested. In particular, there is no `alarms`, `notifications`, `tabs`, `history`, `cookies`,
`debugger`, `webRequest`, `webNavigation`, `downloads`, or `management` permission - each was considered and left out
because nothing in the current feature set needs it. (An earlier draft of Settings had a "weekly summary
notification" toggle that implied scheduled notifications; it was removed because it had no actual `alarms`/
`notifications` implementation behind it - a permission or a UI control should never exist for something the code
doesn't actually do.)

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
