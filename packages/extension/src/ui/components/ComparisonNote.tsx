import React from "react";
import { primaryComparisonSentence } from "@ai-footprint/core";

export function ComparisonNote({ energyWh }: { energyWh: number }) {
  const sentence = primaryComparisonSentence(energyWh);
  return (
    <p className="af-muted af-mt-3" style={{ fontSize: 13 }}>
      {energyWh > 0 ? (
        <>
          Your AI usage this period used {sentence}. This is an approximate comparison, not a precise measurement.
        </>
      ) : (
        sentence
      )}
    </p>
  );
}
