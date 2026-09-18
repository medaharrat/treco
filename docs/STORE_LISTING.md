---
title: Chrome Web Store Listing — Treco (internal)
---

# Chrome Web Store listing copy

Internal reference for submitting/updating Treco's Chrome Web Store listing. Not linked from the public docs site
navigation — kept here so the copy has one source of truth and survives between submissions.

> **Note (rejected submission, keyword spam):** an earlier version of the detailed description listed all 10
> supported providers back-to-back in a comma-separated list. Chrome Web Store's automated review flagged this as
> "excessive/irrelevant keywords" and rejected the item. Fixed by naming only 1-2 providers inline and pointing to
> the in-extension Settings page for the full list, instead of enumerating every brand name in the store
> description. Avoid reintroducing a long comma-separated brand-name list in this field.

## Short description (max 132 characters)

```
See your AI usage and its estimated energy, CO2e & water footprint — entirely on your device. Nothing ever collected.
```
(118 characters)

## Detailed description

```
Treco is a free, open-source browser extension that helps you understand how much you use AI — and gives you a
clearly-labeled estimate of the energy, CO2e, and water associated with that usage. Everything runs locally, on
your device. There's no account, no server, and no conversation content ever collected.

WHAT IT DOES

• Automatically detects when you're chatting with a supported AI assistant (works with ChatGPT and Claude, among
  others — see the full compatibility list on the extension's Settings page) and estimates the tokens involved in
  each interaction.
• Converts those tokens into an estimated energy, CO2e, and water footprint using a documented, per-model
  calculation engine with real, cited sources — never a single hardcoded "grams of CO2 per token" constant.
• Shows a clean dashboard: today/week/month/all-time summaries, a timeline, provider and model breakdowns,
  plain-language insights, optional personal goals, and full settings/export/delete controls.

PRIVACY, BY ARCHITECTURE, NOT BY PROMISE

• No account, no sign-in, nothing to create.
• No server. Treco has no backend of any kind — there's nothing to send your data to, because nothing exists to
  receive it.
• No network requests, period. This isn't just stated — it's enforced by an automated test that scans both the
  source code and the built extension for any network-capable code and fails the build if any is found.
• Conversation content is never stored or transmitted. Estimating token counts requires briefly reading the
  rendered text on a supported AI page, but that text never leaves your browser and is never written to storage —
  only the resulting numeric estimate is kept, and a runtime schema check rejects anything else automatically.
• Minimal permissions: local storage, and host access limited to exactly the AI provider domains listed above.
  Nothing broader.
• Full data control: export everything as JSON/CSV at any time, disable monitoring per provider, or delete all
  locally stored usage history — all from Settings.

HONEST ABOUT WHAT IT DOESN'T KNOW

Every number Treco shows is a clearly-labeled estimate, not a measurement. Energy/CO2e/water figures come from
provider-published disclosures where they exist (OpenAI, Google), and documented fallback tiers otherwise — with
confidence levels and real, checkable sources shown in-app on the Methodology page.

Treco is free and open source. Source code, security policy, and full documentation:
https://github.com/medaharrat/treco
```

## Category

**Workflow & Planning** (secondary consideration: "Tools")

Note: Chrome Web Store's category taxonomy changed in 2023 — "Productivity" was split into several categories,
and there are no subcategories within any of the current top-level options.

## Single purpose statement

```
Treco's single purpose is to estimate and display the environmental footprint (energy, CO2e, water) of a user's
usage of supported AI chat websites, based on locally-observed token counts, entirely on the user's device.
```

## Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Used to persist usage history, settings, and goals locally on the user's device (`chrome.storage.local`). No other use. |
| Host permission: each supported AI provider domain (chat.openai.com, chatgpt.com, claude.ai, gemini.google.com, copilot.microsoft.com, chat.deepseek.com, perplexity.ai, grok.com, x.com, chat.mistral.ai, poe.com, character.ai) | Required so the content script can observe rendered page text on these specific sites to estimate token counts for that interaction. No other site is accessed; each domain corresponds to a supported AI product listed in the extension's Settings, where monitoring can be individually disabled per provider. |

## Data safety / privacy practices form answers

For the Chrome Web Store Developer Dashboard's "Privacy practices" tab:

- **Does this item collect or use user data?** No personal data is collected, sold, or transmitted anywhere — all
  processing and storage is local to the user's device. If the form requires enumerating data *types processed
  locally* rather than *collected/transmitted*, note: usage metadata (provider name, model name, timestamp, token
  counts, estimated energy/CO2e/water) is generated and stored locally only.
- **Is data sold to third parties?** No.
- **Is data used for purposes unrelated to the item's core functionality?** No.
- **Is data used to determine creditworthiness or for lending purposes?** No.
- **Remote code:** No remote code is executed; all code ships in the extension package (verified by automated test,
  see `packages/extension/tests/security.test.ts`).

## Store icon / images checklist

- [x] 128×128 store icon — `packages/extension/public/icons/icon-128.png` (also copied to `chrome-store-upload/store-icon-128.png`
  for the dashboard's separate "Store icon" upload field)
- [x] Screenshots, 1280×800, no alpha channel — see `chrome-store-upload/screenshots/`
- [ ] Optional: small promo tile, 440×280

## Links to paste into the listing

- Homepage / support URL: `https://github.com/medaharrat/treco`
- Privacy Policy URL: `https://medaharrat.github.io/treco/privacy-policy.html`
