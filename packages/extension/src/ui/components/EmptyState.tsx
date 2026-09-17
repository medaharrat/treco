import React from "react";

export function EmptyState({ title, description, icon = "leaf" }: { title: string; description: string; icon?: "leaf" | "chart" | "shield" }) {
  return (
    <div className="af-empty">
      <div className="af-empty-icon" aria-hidden>
        <IconGlyph name={icon} />
      </div>
      <div style={{ fontWeight: 600, color: "var(--af-text-primary)" }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 320 }}>{description}</div>
    </div>
  );
}

function IconGlyph({ name }: { name: "leaf" | "chart" | "shield" }) {
  if (name === "chart") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V9M12 19V5M20 19v-7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21c-4-1-7-5-7-10 0-3 5-8 7-8s7 5 7 8c0 5-3 9-7 10z" strokeLinejoin="round" />
    </svg>
  );
}
