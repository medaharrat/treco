import React from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/providers", label: "Providers" },
  { to: "/models", label: "Models" },
  { to: "/history", label: "History" },
  { to: "/insights", label: "Insights" },
  { to: "/goals", label: "Goals" },
  { to: "/settings", label: "Settings" },
  { to: "/privacy", label: "Privacy" }
];

export function Sidebar() {
  return (
    <nav className="af-sidebar">
      <div className="af-sidebar-brand">
        <span className="af-sidebar-brand-mark" />
        AI Footprint
      </div>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.exact}
          className={({ isActive }) => `af-nav-link ${isActive ? "active" : ""}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
