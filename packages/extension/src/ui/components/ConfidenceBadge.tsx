import React from "react";
import type { Confidence, TokenCountMethod } from "@ai-footprint/core";

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <span className={`af-badge af-badge-confidence-${confidence}`}>{confidence} confidence</span>;
}

const METHOD_LABEL: Record<TokenCountMethod, string> = {
  exact: "Exact",
  estimated: "Estimated",
  inferred: "Inferred"
};

export function TokenMethodBadge({ method }: { method: TokenCountMethod }) {
  return <span className="af-badge">{METHOD_LABEL[method]}</span>;
}
