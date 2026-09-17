import React from "react";
import type { Period } from "@ai-footprint/core";

const LABELS: Record<Period, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
  all: "All time"
};

export function PeriodTabs({
  value,
  onChange,
  options = ["day", "week", "month", "all"]
}: {
  value: Period;
  onChange: (p: Period) => void;
  options?: Period[];
}) {
  return (
    <div className="af-tabs" role="tablist" aria-label="Time period">
      {options.map((p) => (
        <button key={p} className={`af-tab ${value === p ? "active" : ""}`} onClick={() => onChange(p)} role="tab" aria-selected={value === p}>
          {LABELS[p]}
        </button>
      ))}
    </div>
  );
}
