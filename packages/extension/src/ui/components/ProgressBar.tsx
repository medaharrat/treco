import React from "react";

export function ProgressBar({ ratio, tone = "accent" }: { ratio: number; tone?: "accent" | "warning" }) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const color = tone === "warning" || ratio > 1 ? "var(--af-warning)" : "var(--af-accent)";
  return (
    <span className="af-bar-track" style={{ display: "block", height: 10 }}>
      <span className="af-bar-fill" style={{ width: `${clamped * 100}%`, background: color }} />
    </span>
  );
}
