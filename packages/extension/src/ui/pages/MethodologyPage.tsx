import React from "react";
import { Link } from "react-router-dom";
import { ALL_PROFILES, getGlobalDefaultAssumptions } from "@ai-footprint/core";
import { Card } from "../components/Card.js";
import { ConfidenceBadge } from "../components/ConfidenceBadge.js";

interface Citation {
  text: string;
  url: string;
}

const BACKGROUND_SOURCES: Citation[] = [
  {
    text: "Sam Altman, \"The Gentle Singularity\" (June 2025) - OpenAI's own disclosed per-query energy and water figures for ChatGPT.",
    url: "https://blog.samaltman.com/the-gentle-singularity"
  },
  {
    text: "Google, \"Measuring the environmental impact of AI inference\" (Aug 2025) - Google's disclosed median per-prompt energy, carbon and water figures for Gemini Apps, and full technical report.",
    url: "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference"
  },
  {
    text: "de Vries, A., \"The growing energy footprint of artificial intelligence,\" Joule, Vol. 7, Issue 10 (2023) - peer-reviewed academic estimate of LLM inference energy use and its order of magnitude.",
    url: "https://doi.org/10.1016/j.joule.2023.09.004"
  },
  {
    text: "Uptime Institute, Global Data Center Survey 2024 - industry-wide average Power Usage Effectiveness (PUE), used as this app's default facility-overhead assumption.",
    url: "https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024"
  },
  {
    text: "IEA, Electricity and Global Energy Review data series - order-of-magnitude reference for global average grid carbon intensity.",
    url: "https://www.iea.org/topics/electricity"
  }
];

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
        how confident we are, and the public sources behind each assumption - so you (or anyone) can check our work.
      </p>

      <Card>
        <h2 className="af-h2">The calculation, in order</h2>
        <ol style={{ paddingLeft: 20, fontSize: 13.5, lineHeight: 1.8 }}>
          <li>
            Estimate input/output tokens from rendered text length (or use an exposed count, when a provider offers one),
            and detect which model or mode is active from the page where possible.
          </li>
          <li>
            Pick the most specific footprint profile available for that provider/model/mode: a provider-disclosed figure
            when one exists and applies, otherwise a labeled fallback tier (see below).
          </li>
          <li>Multiply tokens by that profile's per-token energy coefficient (or use its flat per-request figure) to get IT-equipment energy.</li>
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
          documented industry averages, not measurements of any specific data center - see "Sources &amp; further reading" below.
        </p>
      </Card>

      <Card>
        <h2 className="af-h2">Reasoning, deep research &amp; agent modes</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Extended-reasoning models (visible chain-of-thought) and multi-step "deep research" or agent modes do
          substantial work behind the scenes that never appears as rendered text - a browser extension has no way to
          observe that hidden compute directly. Rather than pretend those interactions cost the same as an ordinary
          chat message, Treco detects mode/model-name keywords (things like "o1", "reasoning", "deep research", "agent
          mode") and routes them to a distinct, deliberately wider-banded fallback tier instead of a provider's
          disclosed average - even when that average exists for ordinary chat on the same provider. This is a coarse,
          best-effort heuristic based on visible labels, not a measurement, and it's the single biggest source of
          uncertainty in this app; see each tier's confidence badge and methodology note below.
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
                  <li key={i}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.text}
                      </a>
                    ) : (
                      s.text
                    )}
                  </li>
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
        <h2 className="af-h2">Sources &amp; further reading</h2>
        <p className="af-muted" style={{ fontSize: 12.5, marginTop: 0 }}>
          The background research and industry data behind the assumptions above - so you don't have to take our word
          for the order of magnitude.
        </p>
        <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 20 }}>
          {BACKGROUND_SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.text}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="af-h2">What this deliberately does not claim</h2>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>It does not claim to know the exact number of tokens in any conversation unless a provider explicitly exposes one.</li>
          <li>It does not claim to know the exact hardware, data center, or energy mix behind any specific response.</li>
          <li>It does not use a single universal "grams of CO2 per token" constant for every model.</li>
          <li>It does not track model versions by name - provider-disclosed figures describe "the default model at time of publication," not a specific version that will inevitably be superseded.</li>
          <li>
            Figures for reasoning/chain-of-thought models, and especially for deep research or multi-step agent modes,
            are the most uncertain in this app, since none of that hidden work is visible to a browser extension.
          </li>
        </ul>
      </Card>
    </div>
  );
}
