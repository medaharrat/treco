import React from "react";
import { Link } from "react-router-dom";
import { Card } from "./Card.js";
import { Icon, type IconName } from "./Icons.js";

const LEGAL_LINKS: Array<{ to: string; label: string }> = [
  { to: "/legal/privacy-policy", label: "Privacy Policy" },
  { to: "/legal/terms", label: "Terms of Use" },
  { to: "/legal/contact", label: "Contact" },
  { to: "/legal/licenses", label: "Open Source" }
];

export function LegalLayout({
  title,
  icon,
  lastUpdated,
  children
}: {
  title: string;
  icon: IconName;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="af-legal">
      <Link to="/settings" className="af-legal-back">
        <Icon name="arrowLeft" size={15} strokeWidth={2} />
        Back to Settings
      </Link>

      <h1 className="af-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={icon} size={19} strokeWidth={2} />
        {title}
      </h1>
      <p className="af-subtitle">Last updated {lastUpdated}</p>

      <Card>
        <div className="af-legal-content">{children}</div>
      </Card>

      <div className="af-legal-footer af-mt-4">
        {LEGAL_LINKS.map((link, i) => (
          <React.Fragment key={link.to}>
            {i > 0 && <span aria-hidden>&middot;</span>}
            <Link to={link.to}>{link.label}</Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
