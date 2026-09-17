import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "../../components/LegalLayout.js";

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" icon="shield" lastUpdated="September 17, 2026">
      <p className="af-muted" style={{ marginTop: -8, fontSize: 12.5 }}>
        Effective date: September 17, 2026
      </p>
      <p>
        Treco is a free, open-source, non-commercial browser extension, developed and maintained by an individual
        developer - not a company, and not operated through any registered business entity. This Privacy Policy
        explains what Treco does, what data it processes, and what it never collects. It describes the extension
        exactly as implemented today, not an idealized version of it.
      </p>

      <h2>1. What Treco does</h2>
      <p>Treco is a browser extension that:</p>
      <ul>
        <li>Detects your interactions on supported AI websites (see the list in Settings → Providers).</li>
        <li>Estimates the number of tokens involved in each interaction, and the resulting energy, CO2e and water footprint.</li>
        <li>Builds historical, aggregated statistics from that data: daily/weekly/monthly summaries, provider and model breakdowns, trends and optional goal tracking.</li>
        <li>Displays all of this to you locally, in the extension's popup and dashboard.</li>
      </ul>
      <p>
        Treco is provided free of charge. There is no paid subscription or tier, no advertising, no account system, no
        analytics or telemetry, and no server-side storage of any kind - Treco has no server or backend at all.
      </p>

      <h2>2. What data Treco processes</h2>
      <p>For each detected interaction, Treco's background service worker constructs and stores a small usage record containing:</p>
      <ul>
        <li>The provider/service name (for example, "Claude" or "ChatGPT").</li>
        <li>The model name, when the page exposes it.</li>
        <li>A timestamp.</li>
        <li>Token counts - input, output and total - which are exact when the provider's page exposes exact figures, and estimated otherwise. Each record is tagged with which method was used.</li>
        <li>Estimated environmental figures derived from those token counts (energy in Wh, CO2e in grams, water in mL) and a confidence label.</li>
        <li>An internal identifier for the calculation profile used, so the methodology behind a number can always be traced.</li>
      </ul>
      <p>
        Aggregated historical statistics (totals, trends, streaks) shown on the dashboard are computed locally, on demand, from
        these stored records - they are not a separately collected dataset.
      </p>
      <p>
        Treco also stores whatever you explicitly configure: which providers are enabled, your unit preference, theme, any
        optional usage goals you set, and an optional local electricity-grid carbon-intensity override.
      </p>

      <h2>3. About conversation content</h2>
      <p>
        We want to be precise here rather than reassuring in a way that isn't technically accurate. To estimate token counts,
        Treco's content script needs to read the rendered text on the page of a supported AI site while you're using it - this
        can include the visible text of your messages and the AI's replies, because that is the only way to measure roughly how
        much text was involved.
      </p>
      <p>
        That text is read transiently, in your browser, purely to calculate a character/token count. It is never written to
        storage, never logged, and never transmitted anywhere - only the resulting numbers (token counts, not the text itself)
        leave that calculation. As a technical safeguard, every record written to storage is validated against a strict
        allow-list of fields before it's saved; any attempt to store a long text field or an unrecognized field is rejected
        automatically, so conversation content cannot end up in Treco's storage even by accident.
      </p>

      <h2>4. What Treco does not collect</h2>
      <ul>
        <li>Chat transcripts, or your prompts/responses stored as text.</li>
        <li>Screenshots of any page.</li>
        <li>Keystroke logs.</li>
        <li>Passwords or authentication credentials.</li>
        <li>Cookies or session tokens belonging to you or to any AI provider.</li>
        <li>Browsing history on sites unrelated to the supported AI providers.</li>
        <li>Personal information (name, email, account identifiers) - Treco has no account system and does not ask for any.</li>
      </ul>

      <h2>5. Where your data is stored</h2>
      <p>
        All usage records, settings and goals are stored using your browser's local extension storage (<code>chrome.storage.local</code>{" "}
        or the equivalent in your browser), on your own device. Treco does not use any cross-device sync storage, and there is no
        remote database or server that your data is uploaded to - none exists. If you uninstall the extension, this locally
        stored data is removed by the browser along with it.
      </p>
      <p>
        Treco does not currently include any analytics, telemetry, crash reporting, or error-logging service of any kind - none
        is built into the extension, and none runs in the background. If that ever changed in a future version, it would be
        off by default, clearly disclosed in an update to this policy, and controllable from Settings.
      </p>

      <h2>6. Third parties</h2>
      <p>
        Treco's content script runs on the AI provider pages you visit so it can observe usage there, but Treco does not make
        network requests to those providers, to any Treco-operated infrastructure (none exists), or to any other third party.
        Treco does not have access to your account, billing, or conversation data on any AI provider's own systems - only to
        what is visibly rendered on the page while you're using it, as described above.
      </p>
      <p>
        The providers currently supported are listed in the extension's Settings → Providers page; the extension only requests
        browser permission to run on those specific domains, and only observes a provider's page if you've left that provider
        enabled.
      </p>

      <h2>7. Environmental estimates</h2>
      <p>
        The energy, CO2e and water figures Treco shows are estimates, not direct measurements. No AI provider currently
        publishes per-request telemetry precise enough to measure these values exactly, so Treco derives them from
        published research, provider-disclosed figures where they exist, and documented model-specific or fallback-tier
        coefficients otherwise. Every figure in the UI is labeled with a confidence/method indicator reflecting how it was
        derived.
      </p>
      <p>
        These estimates can vary meaningfully depending on the specific model, the provider's underlying infrastructure and
        hardware, real-world workload and load conditions, the geography and electricity mix of the data center actually used,
        and the calculation methodology itself. See the in-app Methodology page for the full calculation and its sources and
        assumptions.
      </p>

      <h2>8. Your controls</h2>
      <ul>
        <li>
          <strong>Delete your data:</strong> Settings → Data storage → "Delete all usage history" permanently removes all
          locally stored usage history.
        </li>
        <li>
          <strong>Export your data:</strong> Settings → Data storage lets you export all stored usage records as JSON or CSV at
          any time; this is a local file download, not a transmission anywhere.
        </li>
        <li>
          <strong>Disable individual providers:</strong> Settings → Providers lets you turn monitoring off per provider; the
          content script does not even activate on a disabled provider's pages.
        </li>
        <li>
          <strong>Disable analytics/telemetry:</strong> not applicable today, since none exists to disable; this section will be
          updated if that ever changes.
        </li>
        <li>
          <strong>Uninstall:</strong> removing the extension removes its locally stored data along with it, per your browser's
          standard extension-storage behavior.
        </li>
      </ul>

      <h2>9. Security</h2>
      <p>
        Treco is built around minimizing what it collects in the first place: it requests only the browser permissions it
        needs (local storage), only requests host access to the
        specific AI provider domains it supports, and validates every record against a strict schema before storing it so that
        unexpected or oversized data - such as accidental conversation content - is rejected rather than saved. Because your
        data stays on your device, its security also depends on the security of your own browser profile and device.
      </p>

      <h2>10. Children's privacy</h2>
      <p>
        Treco is not directed at children and is not intended for use by anyone under the age of 18. Treco does not
        knowingly collect personal information from children, and given it has no account system, no personal
        information is knowingly collected from anyone.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        If this policy changes, the "Last updated" date above will be updated and, for material changes, the change will be
        noted inside the extension (for example, on the Settings or About page) with the next update. We encourage checking
        back periodically.
      </p>

      <h2>12. Open source</h2>
      <p>
        Treco's source code is public. See the <Link to="/legal/licenses">Open Source</Link> page for the project's license
        status and third-party attributions.
      </p>

      <h2>13. Legal identity</h2>
      <p>
        Treco is operated by an individual developer, not through a registered company or commercial entity. There is
        no corporate address to disclose here because none exists - this policy is issued directly by the developer,
        based in Hungary.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about this policy or Treco's data practices can be raised via the project's public GitHub
        repository - see the <Link to="/legal/contact">Contact</Link> page for the exact link and what to include in
        a report.
      </p>
    </LegalLayout>
  );
}
