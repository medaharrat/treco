import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "../../components/LegalLayout.js";
import { Icon } from "../../components/Icons.js";

export function ContactPage() {
  return (
    <LegalLayout title="Contact & Support" icon="mail" lastUpdated="September 17, 2026">
      <p>
        Treco is a free, open-source project maintained by an individual developer - there's no support team, company,
        or dedicated email inbox behind it. The project's public GitHub repository is the official contact and
        support channel.
      </p>

      <h2>GitHub (official channel)</h2>
      <p>
        For bug reports, provider-compatibility issues, and feature requests, open an issue directly:
      </p>
      <p>
        <a
          href="https://github.com/medaharrat/treco/issues"
          target="_blank"
          rel="noreferrer"
          className="af-btn af-btn-secondary"
          style={{ display: "inline-flex", textDecoration: "none" }}
        >
          <Icon name="external" size={15} strokeWidth={2} />
          github.com/medaharrat/treco/issues
        </a>
      </p>

      <h2>Security or privacy reports</h2>
      <p>
        For anything sensitive - a suspected security or privacy issue you'd rather not post publicly - use GitHub's
        private vulnerability reporting on the repository instead of a public issue:
      </p>
      <p>
        <a
          href="https://github.com/medaharrat/treco/security/advisories/new"
          target="_blank"
          rel="noreferrer"
          className="af-btn af-btn-secondary"
          style={{ display: "inline-flex", textDecoration: "none" }}
        >
          <Icon name="external" size={15} strokeWidth={2} />
          github.com/medaharrat/treco/security/advisories/new
        </a>
      </p>
      <p className="af-muted" style={{ fontSize: 12.5 }}>
        See{" "}
        <a href="https://github.com/medaharrat/treco/blob/main/SECURITY.md" target="_blank" rel="noreferrer">
          SECURITY.md
        </a>{" "}
        in the repository for what a good report should include.
      </p>

      <h2>What you can reach out about</h2>
      <ul>
        <li>
          <strong>Privacy or security questions</strong> - anything about what Treco does or doesn't access, or a suspected
          security issue. See the <Link to="/legal/privacy-policy">Privacy Policy</Link> for the full detail first.
        </li>
        <li>
          <strong>Bug reports</strong> - something in the dashboard, popup, or a calculation looks wrong.
        </li>
        <li>
          <strong>Provider compatibility issues</strong> - a supported AI site changed its page and Treco stopped detecting
          usage correctly, or you'd like a new provider supported.
        </li>
        <li>
          <strong>Feedback and feature requests</strong> - what would make Treco more useful to you.
        </li>
      </ul>

      <h2>Response times</h2>
      <p>
        Treco is developed and maintained in personal time by a single developer, so please allow reasonable time for a
        response. Security-sensitive reports will be prioritized where possible.
      </p>
    </LegalLayout>
  );
}
