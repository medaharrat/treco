import React from "react";

export function StatTile({ value, label, large = false }: { value: string; label: string; large?: boolean }) {
  return (
    <div className={`af-stat ${large ? "af-stat-lg" : ""}`}>
      <div className="af-stat-value">{value}</div>
      <div className="af-stat-label">{label}</div>
    </div>
  );
}
