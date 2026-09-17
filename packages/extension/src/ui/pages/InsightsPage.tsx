import React, { useMemo } from "react";
import { generateInsights, type Insight } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Card } from "../components/Card.js";
import { EmptyState } from "../components/EmptyState.js";

const ICONS: Record<Insight["kind"], string> = {
  "trend-up": "↑",
  "trend-down": "↓",
  "top-contributor": "◆",
  "output-heavy": "▤",
  streak: "●",
  optimization: "✓",
  milestone: "★"
};

export function InsightsPage() {
  const { events } = useStorage();
  const insights = useMemo(() => generateInsights(events), [events]);

  return (
    <div>
      <h1 className="af-h1">Insights</h1>
      <p className="af-subtitle">Plain-language observations generated from your locally stored usage. No shaming, just facts.</p>

      <Card>
        {insights.length === 0 ? (
          <EmptyState
            icon="chart"
            title="Not enough data for insights yet"
            description="Insights appear once there's a bit of usage history to compare against - usually after a few days."
          />
        ) : (
          <div className="af-insight-list">
            {insights.map((insight) => (
              <div key={insight.id} className="af-insight-item">
                <span className="af-insight-icon">{ICONS[insight.kind]}</span>
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
