---
title: Treco Privacy Policy
---

# Privacy Policy

*Effective date: September 17, 2026 · Last updated: September 17, 2026*

Treco is a free, open-source, non-commercial browser extension, developed and maintained by an individual developer
— not a company, and not operated through any registered business entity. This Privacy Policy explains what Treco
does, what data it processes, and what it never collects. It describes the extension exactly as implemented today,
not an idealized version of it.

## 1. What Treco does

Treco is a browser extension that:

- Detects your interactions on supported AI websites (see the list in Settings → Providers).
- Estimates the number of tokens involved in each interaction, and the resulting energy, CO2e and water footprint.
- Builds historical, aggregated statistics from that data: daily/weekly/monthly summaries, provider and model
  breakdowns, trends and optional goal tracking.
- Displays all of this to you locally, in the extension's popup and dashboard.

Treco is provided free of charge. There is no paid subscription or tier, no advertising, no account system, no
analytics or telemetry, and no server-side storage of any kind — Treco has no server or backend at all.

## 2. What data Treco processes

For each detected interaction, Treco's background service worker constructs and stores a small usage record
containing:

- The provider/service name (for example, "Claude" or "ChatGPT").
- The model name, when the page exposes it.
- A timestamp.
- Token counts — input, output and total — which are exact when the provider's page exposes exact figures, and
  estimated otherwise. Each record is tagged with which method was used.
- Estimated environmental figures derived from those token counts (energy in Wh, CO2e in grams, water in mL) and a
  confidence label.
- An internal identifier for the calculation profile used, so the methodology behind a number can always be traced.

Aggregated historical statistics (totals, trends, streaks) shown on the dashboard are computed locally, on demand,
from these stored records — they are not a separately collected dataset.

Treco also stores whatever you explicitly configure: which providers are enabled, your unit preference, theme, any
optional usage goals you set, and an optional local electricity-grid carbon-intensity override.

## 3. About conversation content

We want to be precise here rather than reassuring in a way that isn't technically accurate. To estimate token
counts, Treco's content script needs to read the rendered text on the page of a supported AI site while you're using
it — this can include the visible text of your messages and the AI's replies, because that is the only way to
measure roughly how much text was involved.

That text is read transiently, in your browser, purely to calculate a character/token count. It is never written to
storage, never logged, and never transmitted anywhere — only the resulting numbers (token counts, not the text
itself) leave that calculation. As a technical safeguard, every record written to storage is validated against a
strict allow-list of fields before it's saved; any attempt to store a long text field or an unrecognized field is
rejected automatically, so conversation content cannot end up in Treco's storage even by accident.

## 4. What Treco does not collect

- Chat transcripts, or your prompts/responses stored as text.
- Screenshots of any page.
- Keystroke logs.
- Passwords or authentication credentials.
- Cookies or session tokens belonging to you or to any AI provider.
- Browsing history on sites unrelated to the supported AI providers.
- Personal information (name, email, account identifiers) — Treco has no account system and does not ask for any.

## 5. Where your data is stored

All usage records, settings and goals are stored using your browser's local extension storage
(`chrome.storage.local` or the equivalent in your browser), on your own device. Treco does not use any cross-device
sync storage, and there is no remote database or server that your data is uploaded to — none exists. If you
uninstall the extension, this locally stored data is removed by the browser along with it.

Treco does not currently include any analytics, telemetry, crash reporting, or error-logging service of any kind —
none is built into the extension, and none runs in the background. If that ever changed in a future version, it
would be off by default, clearly disclosed in an update to this policy, and controllable from Settings.

## 6. Third parties

Treco's content script runs on the AI provider pages you visit so it can observe usage there, but Treco does not
make network requests to those providers, to any Treco-operated infrastructure (none exists), or to any other third
party. Treco does not have access to your account, billing, or conversation data on any AI provider's own systems —
only to what is visibly rendered on the page while you're using it, as described above.

The providers currently supported are listed in the extension's Settings → Providers page; the extension only
requests browser permission to run on those specific domains, and only observes a provider's page if you've left
that provider enabled.

## 7. Environmental estimates

The energy, CO2e and water figures Treco shows are estimates, not direct measurements. No AI provider currently
publishes per-request telemetry precise enough to measure these values exactly, so Treco derives them from
published research, provider-disclosed figures where they exist, and documented model-specific or fallback-tier
coefficients otherwise. Every figure in the UI is labeled with a confidence/method indicator reflecting how it was
derived.

These estimates can vary meaningfully depending on the specific model, the provider's underlying infrastructure and
hardware, real-world workload and load conditions, the geography and electricity mix of the data center actually
used, and the calculation methodology itself. See [Methodology](METHODOLOGY.md) for the full calculation and its
sources and assumptions.

## 8. Your controls

- **Delete your data:** Settings → Data storage → "Delete all usage history" permanently removes all locally stored
  usage history.
- **Export your data:** Settings → Data storage lets you export all stored usage records as JSON or CSV at any time;
  this is a local file download, not a transmission anywhere.
- **Disable individual providers:** Settings → Providers lets you turn monitoring off per provider; the content
  script does not even activate on a disabled provider's pages.
- **Disable analytics/telemetry:** not applicable today, since none exists to disable; this section will be updated
  if that ever changes.
- **Uninstall:** removing the extension removes its locally stored data along with it, per your browser's standard
  extension-storage behavior.

## 9. Security

Treco is built around minimizing what it collects in the first place: it requests only the browser permissions it
needs (local storage), only requests host access to the specific AI provider domains it supports, and validates
every record against a strict schema before storing it so that unexpected or oversized data — such as accidental
conversation content — is rejected rather than saved. Because your data stays on your device, its security also
depends on the security of your own browser profile and device.

## 10. Children's privacy

Treco is not directed at children and is not intended for use by anyone under the age of 18. Treco does not
knowingly collect personal information from children, and given it has no account system, no personal information
is knowingly collected from anyone.

## 11. Changes to this policy

If this policy changes, the date above will be updated and, for material changes, the change will be noted inside
the extension (for example, on the Settings or About page) with the next update. We encourage checking back
periodically.

## 12. Open source

Treco's source code is public at [github.com/medaharrat/treco](https://github.com/medaharrat/treco). It is licensed
under the [MIT License](https://github.com/medaharrat/treco/blob/main/LICENSE).

## 13. Legal identity

Treco is operated by an individual developer, not through a registered company or commercial entity. There is no
corporate address to disclose here because none exists — this policy is issued directly by the developer, based in
Hungary.

## 14. Contact

Questions about this policy or Treco's data practices can be raised via the project's public GitHub repository —
see [Contact](contact.md) for the exact link and what to include in a report.

---

[← Back to index](index.md) · [Terms of Use](terms.md) · [Contact](contact.md)
