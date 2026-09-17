import React from "react";

export function TrendBadge({ pct, direction }: { pct: number; direction: "up" | "down" | "flat" }) {
  if (direction === "flat") {
    return <span className="af-trend" style={{ color: "var(--af-text-tertiary)", background: "var(--af-surface-hover)" }}>steady</span>;
  }
  const arrow = direction === "down" ? "↓" : "↑";
  return <span className={`af-trend af-trend-${direction}`}>{arrow} {pct}% vs last period</span>;
}
