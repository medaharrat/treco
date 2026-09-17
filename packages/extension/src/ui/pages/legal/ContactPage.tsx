import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "../../components/LegalLayout.js";
import { Icon } from "../../components/Icons.js";

const TODO = ({ children }: { children: React.ReactNode }) => <span className="af-legal-todo">{children}</span>;

export function ContactPage() {
  return (
    <LegalLayout title="Contact & Support" icon="mail" lastUpdated="September 17, 2026">
      <p>
        Treco is a free, open-source project maintained by an individual developer - there's no support team or company
        behind it. The most reliable way to reach the developer right now is through the project's GitHub repository.
      </p>

      <h2>GitHub (current primary channel)</h2>
      <p>
        For bug reports, provider-compatibility issues, or feature requests, opening an issue on GitHub is the best way to
        reach the developer:
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

      <h2>Email</h2>
      <p>
        A dedicated contact email has not been set up yet: <TODO>[PLACEHOLDER: contact email - to be added once configured]</TODO>.
        This page will be updated with a real address once one exists - until then, please use GitHub.
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
