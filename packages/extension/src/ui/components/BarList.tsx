import React from "react";

export interface BarListItem {
  key: string;
  label: string;
  share: number;
  color?: string;
}

export function BarList({ items, onSelect }: { items: BarListItem[]; onSelect?: (key: string) => void }) {
  if (items.length === 0) {
    return <p className="af-muted">No usage recorded for this period yet.</p>;
  }
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.key}
          className="af-bar-row"
          style={onSelect ? { cursor: "pointer" } : undefined}
          onClick={() => onSelect?.(item.key)}
          role={onSelect ? "button" : undefined}
        >
          <span className="af-bar-row-label">
            <span className="af-bar-dot" style={{ background: item.color ?? "var(--af-accent)" }} />
            <span className="af-bar-row-label-text">{item.label}</span>
          </span>
          <span className="af-bar-track">
            <span className="af-bar-fill" style={{ width: `${Math.max(2, item.share * 100)}%` }} />
          </span>
          <span className="af-bar-row-pct">{Math.round(item.share * 100)}%</span>
        </div>
      ))}
    </div>
  );
}
