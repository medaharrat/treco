import React from "react";
import { Link } from "react-router-dom";
import { ALL_PROFILES, getGlobalDefaultAssumptions } from "@ai-footprint/core";
import { Card } from "../components/Card.js";
import { ConfidenceBadge } from "../components/ConfidenceBadge.js";

export function MethodologyPage() {
  const defaults = getGlobalDefaultAssumptions();

  return (
    <div>
      <Link to="/settings" className="af-muted" style={{ fontSize: 12.5, textDecoration: "none" }}>
        ← Settings
      </Link>
      <h1 className="af-h1 af-mt-2">Environmental methodology</h1>
      <p className="af-subtitle">
        Every number in Treco is an estimate. Here is exactly how each figure is calculated, what assumptions go into it,
        and how confident we are.
      </p>

      <Card>
        <h2 className="af-h2">The calculation, in order</h2>
        <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.8 }}>
          <li>Estimate input/output tokens from rendered text length (or use an exposed count, when a provider offers one).</li>
          <li>Multiply tokens by a per-token energy coefficient (or use a flat per-request figure) to get IT-equipment energy.</li>
          <li>
            Multiply by the data center's Power Usage Effectiveness (PUE) to account for cooling and facility overhead, giving
            total facility energy.
          </li>
          <li>Multiply facility energy (in kWh) by an assumed grid carbon intensity to get estimated CO2e.</li>
          <li>Multiply facility energy (in kWh) by an assumed Water Usage Effectiveness (WUE) to get estimated water use.</li>
        </ol>
        <p className="af-muted" style={{ fontSize: 12.5 }}>
          Global default assumptions used when no model-specific figure is available: PUE {defaults.pue}, grid carbon intensity{" "}
          {defaults.carbonIntensityGPerKwh} g CO2e/kWh, water usage effectiveness {defaults.waterMlPerKwh} mL/kWh. These are broad,
          documented industry averages, not measurements of any specific data center.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Model &amp; provider profiles</h2>
        <div className="af-flex-col af-gap-4">
          {ALL_PROFILES.map((profile) => (
            <div key={profile.id} style={{ borderBottom: "1px solid var(--af-border-soft)", paddingBottom: 16 }}>
              <div className="af-row af-mb-2">
                <span style={{ fontWeight: 600 }}>{profile.model}</span>
                <ConfidenceBadge confidence={profile.confidence} />
              </div>
              <p style={{ fontSize: 13, margin: "0 0 6px" }}>{profile.methodologyNote}</p>
              <ul style={{ fontSize: 12, color: "var(--af-text-secondary)", paddingLeft: 18, margin: "0 0 6px" }}>
                {profile.sources.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <span className="af-muted" style={{ fontSize: 11.5 }}>
                Last reviewed {profile.lastUpdated} · {profile.isFallback ? "Generic fallback tier" : "Provider-published figures"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">What this deliberately does not claim</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>It does not claim to know the exact number of tokens in any conversation unless a provider explicitly exposes one.</li>
          <li>It does not claim to know the exact hardware, data center, or energy mix behind any specific response.</li>
          <li>It does not use a single universal "grams of CO2 per token" constant for every model.</li>
          <li>Figures for reasoning/chain-of-thought models are especially uncertain, since hidden reasoning tokens aren't visible to a browser extension.</li>
        </ul>
      </Card>
    </div>
  );
}
