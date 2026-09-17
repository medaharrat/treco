import React from "react";
import { LegalLayout } from "../../components/LegalLayout.js";

const PACKAGES: Array<{ name: string; license: string; url: string }> = [
  { name: "React & React DOM", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "React Router", license: "MIT", url: "https://github.com/remix-run/react-router" },
  { name: "webextension-polyfill", license: "Mozilla Public License 2.0", url: "https://github.com/mozilla/webextension-polyfill" },
  { name: "Vite", license: "MIT", url: "https://github.com/vitejs/vite" },
  { name: "TypeScript", license: "Apache License 2.0", url: "https://github.com/microsoft/TypeScript" },
  {
    name: "Simple Icons (Claude/Anthropic, Gemini, DeepSeek, Perplexity, Mistral, Poe marks used in onboarding)",
    license: "CC0 1.0",
    url: "https://github.com/simple-icons/simple-icons"
  },
  {
    name: "OpenAI icon mark (used in onboarding)",
    license: "PD-textlogo (Wikimedia Commons)",
    url: "https://commons.wikimedia.org/wiki/File:OpenAI_logo_2025_(symbol).svg"
  },
  {
    name: "Microsoft 365 Copilot icon (used in onboarding)",
    license: "PD-textlogo (Wikimedia Commons)",
    url: "https://commons.wikimedia.org/wiki/File:Microsoft_365_Copilot_Icon_one-color.svg"
  },
  {
    name: "xAI icon mark, used for Grok (used in onboarding)",
    license: "CC BY-SA 4.0 (Wikimedia Commons)",
    url: "https://commons.wikimedia.org/wiki/File:XAI_Logo.svg"
  }
];

export function LicensesPage() {
  return (
    <LegalLayout title="Open Source" icon="layers" lastUpdated="September 17, 2026">
      <p>
        Treco is a free, open-source project. Its source code is publicly available at{" "}
        <a href="https://github.com/medaharrat/treco" target="_blank" rel="noreferrer">
          github.com/medaharrat/treco
        </a>
        .
      </p>

      <h2>Treco's own license</h2>
      <p>
        Treco is licensed under the{" "}
        <a href="https://github.com/medaharrat/treco/blob/main/LICENSE" target="_blank" rel="noreferrer">
          MIT License
        </a>
        . You're free to use, copy, modify, merge, publish, and distribute this software, including for commercial
        purposes, as long as the original copyright notice and license text are included - see the LICENSE file in
        the repository for the exact terms.
      </p>

      <h2>Third-party components</h2>
      <p>
        Treco is built with the following open-source components, each under its own license. We're grateful to their
        maintainers and contributors. This list covers packages Treco ships to your browser at runtime; build-time-only
        tooling (bundlers, test runners, linters) is not included here.
      </p>
      <ul>
        {PACKAGES.map((pkg) => (
          <li key={pkg.name}>
            <a href={pkg.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              {pkg.name}
            </a>{" "}
            - {pkg.license}
          </li>
        ))}
      </ul>
      <p className="af-muted" style={{ fontSize: 12.5 }}>
        Each package remains the property of its respective authors under its own license, linked above.
      </p>

      <h2>Third-party trademarks</h2>
      <p className="af-muted" style={{ fontSize: 12.5 }}>
        The onboarding screen displays brand marks (sourced as listed above) or a short label to identify the AI
        products Treco can detect usage on. Those names and marks are trademarks of their respective owners
        (OpenAI, Anthropic, Google, Microsoft, DeepSeek, Perplexity AI, xAI, Mistral AI, Quora, and Character
        Technologies), used solely to identify compatibility - Treco is not affiliated with, endorsed by, or
        sponsored by any of them. Character.AI has no verifiable freely-licensed mark available and is shown as a
        plain colored label instead.
      </p>
    </LegalLayout>
  );
}
