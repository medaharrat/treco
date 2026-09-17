import React from "react";
import { primaryComparisonSentence } from "@ai-footprint/core";

export function ComparisonNote({ energyWh }: { energyWh: number }) {
  return (
    <p className="af-muted af-mt-3" style={{ fontSize: 13 }}>
      Your AI usage this period used {primaryComparisonSentence(energyWh)}. This is an approximate comparison, not a precise
      measurement.
    </p>
  );
}
