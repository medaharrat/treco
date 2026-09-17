import React from "react";
import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "./Icons.js";

const LINKS: Array<{ to: string; label: string; exact?: boolean; icon: IconName }> = [
  { to: "/", label: "Dashboard", exact: true, icon: "grid" },
  { to: "/providers", label: "Providers", icon: "globe" },
  { to: "/models", label: "Models", icon: "layers" },
  { to: "/history", label: "History", icon: "clock" },
  { to: "/insights", label: "Insights", icon: "sparkle" },
  { to: "/goals", label: "Goals", icon: "target" },
  { to: "/settings", label: "Settings", icon: "settings" },
  { to: "/privacy", label: "Privacy", icon: "shield" }
];

export function Sidebar() {
  return (
    <nav className="af-sidebar">
      <div className="af-sidebar-brand">
        <span className="af-sidebar-brand-mark">
          <Icon name="leaf" size={15} strokeWidth={2} />
        </span>
        Treco
      </div>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.exact}
          className={({ isActive }) => `af-nav-link ${isActive ? "active" : ""}`}
        >
          <Icon name={link.icon} size={17} />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
