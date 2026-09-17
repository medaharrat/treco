import React from "react";
import { Card } from "../components/Card.js";

export function PrivacyPage() {
  return (
    <div>
      <h1 className="af-h1">Privacy</h1>
      <p className="af-subtitle">A complete, specific account of what this extension can access and what it does not collect.</p>

      <Card>
        <h2 className="af-h2">What AI Footprint never does</h2>
        <ul style={{ fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Never reads, stores, or transmits your prompts or the AI's responses.</li>
          <li>Never takes screenshots or records page content beyond a momentary text-length measurement.</li>
          <li>Never reads or collects cookies, authentication tokens, or session data.</li>
          <li>Never sends any data to AI Footprint's own servers - because it has none. Everything runs on your device.</li>
          <li>Never requires an account, sign-in, or any personal information.</li>
          <li>Never tracks you on any website outside the specific AI products you enable.</li>
          <li>Includes no analytics, telemetry, or third-party trackers by default.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="af-h2">What it does access, and why</h2>
        <p style={{ fontSize: 13.5 }}>
          On pages belonging to AI products you've explicitly enabled, AI Footprint's content script observes the page's DOM to
          detect when a new message has finished rendering. It measures the <em>length</em> of that rendered text to estimate a
          token count, then immediately discards the text itself. The only things that leave the page are numbers: a provider id,
          a model name, an input/output token estimate, a method tag (exact/estimated/inferred), and a timestamp.
        </p>
        <p style={{ fontSize: 13.5 }}>
          Host permissions are limited to the specific domains of supported AI products - never all websites. The content script
          simply does not run anywhere else.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">What is stored, exactly</h2>
        <p style={{ fontSize: 13.5, marginBottom: 8 }}>Each recorded interaction contains only:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 13 }}>
          {[
            "provider",
            "model",
            "timestamp",
            "estimated input tokens",
            "estimated output tokens",
            "estimated total tokens",
            "estimated energy",
            "estimated CO2e",
            "estimated water",
            "confidence level"
          ].map((f) => (
            <span key={f} className="af-muted">
              · {f}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 13, marginTop: 12 }}>
          This is enforced in code, not just policy: every event is validated against an exhaustive allow-list of fields before it
          is ever written to storage, and any unexpected field (or an implausibly long string that might indicate leaked text)
          causes the event to be rejected rather than silently stored.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Where your data lives</h2>
        <p style={{ fontSize: 13.5 }}>
          All data is stored using your browser's local extension storage, on this device only. It is never synced to any
          AI Footprint server, because none exists. You can export everything as JSON or CSV, or delete it permanently, at any
          time from Settings.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Estimates, not surveillance</h2>
        <p style={{ fontSize: 13.5 }}>
          Because AI Footprint never reads conversation content beyond a text-length measurement, its token counts are estimates
          in almost all cases - clearly labeled as such - not exact figures pulled from a provider's backend. See{" "}
          <strong>Settings → Environmental methodology</strong> for full detail on how every number is calculated.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Optional future cloud sync</h2>
        <p style={{ fontSize: 13.5 }}>
          Cloud synchronization does not exist in this version. If it is ever added, it will be a separate, off-by-default
          feature that requires explicit opt-in before any data leaves your device.
        </p>
      </Card>
    </div>
  );
}
