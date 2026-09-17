# Security Policy

Treco is a free, open-source, non-commercial browser extension maintained by an individual developer. This document
explains how to report a security issue, and what Treco's security model actually looks like.

## Reporting a vulnerability

If you find a security or privacy issue in Treco, please report it privately rather than opening a public GitHub
issue, so users aren't exposed while a fix is prepared.

Treco has no dedicated security email - the project's public GitHub repository is the official channel:

- **Preferred:** GitHub's [private vulnerability reporting](https://github.com/medaharrat/treco/security/advisories/new)
  feature on the repository, so the report isn't immediately public.
- **Alternative:** open a GitHub issue at
  [github.com/medaharrat/treco/issues](https://github.com/medaharrat/treco/issues) marked clearly as sensitive if
  private reporting isn't available to you.

A good report includes:

- A clear description of the issue and its potential impact.
- Steps to reproduce it (which browser/version, which AI provider page if relevant, exact actions taken).
- Any relevant logs, screenshots, or a minimal reproduction.
- Whether you believe conversation content, stored usage data, or anything else could be exposed.

### Responsible disclosure

Treco is maintained on a best-effort, volunteer basis with no dedicated security team, so please allow reasonable
time for a fix before any public disclosure. There is no bug bounty program. Reports that clearly try to help rather
than exploit are appreciated - thank you in advance.

## Treco's security model, briefly

Treco's security posture rests on doing very little, rather than doing a lot securely:

- **No backend.** Treco has no server of any kind. There is nothing to breach on Treco's side because nothing exists
  there to breach.
- **No network requests.** The extension makes no outbound network calls - no analytics, no telemetry, no remote
  config, no update-check pings beyond what the browser's own extension store infrastructure does. This is enforced
  by an automated test suite that scans both the source and the built extension bundle for network-capable APIs
  (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `eval`, `new Function`) and fails if any appear.
- **Minimal permissions.** The manifest requests only `storage`, plus host access to the specific
  supported AI provider domains listed in Settings → Providers - nothing broader (no `<all_urls>`, `tabs`, `history`,
  `cookies`, `debugger`, `webRequest`, `webNavigation`, `downloads`, or `management`).
- **Local-only storage.** All data lives in the browser's local extension storage on your device. There is no sync,
  no export to any server, and no account system.
- **Strict validation at every boundary.** Messages from content scripts, and any imported file, are checked against
  a strict allow-list schema before being processed or stored; unexpected fields, oversized strings, and wrong types
  are rejected rather than silently accepted. See `docs/ARCHITECTURE.md` for the full data-flow diagram.
- **No secrets.** The extension ships no API keys, credentials, or tokens of any kind - there is nothing to leak from
  the codebase because it holds no service to authenticate to.

None of this means Treco is "unhackable" - no software is. It means the attack surface is intentionally small, and
most of its privacy/security properties (no network calls, restricted permissions, storage schema enforcement) are
things you can verify yourself by reading the source or inspecting the built extension, not just trust.

## Scope

This policy covers the Treco browser extension itself (this repository). It does not cover the security of the
third-party AI provider websites Treco observes usage on - those are outside Treco's control; see the in-extension
Terms of Use page (Settings → Legal & Support → Terms of Use) for more on that boundary.
