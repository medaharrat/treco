import React, { useMemo } from "react";
import { generateInsights, type Insight } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Card } from "../components/Card.js";
import { EmptyState } from "../components/EmptyState.js";
import { Icon, type IconName } from "../components/Icons.js";

const ICONS: Record<Insight["kind"], IconName> = {
  "trend-up": "thermometer",
  "trend-down": "leaf",
  "top-contributor": "target",
  "output-heavy": "layers",
  streak: "sparkle",
  optimization: "recycle",
  milestone: "tree"
};

export function InsightsPage() {
  const { events } = useStorage();
  const insights = useMemo(() => generateInsights(events), [events]);

  return (
    <div>
      <h1 className="af-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="sparkle" size={19} strokeWidth={2} />
        Insights
      </h1>
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
                <span className="af-insight-icon">
                  <Icon name={ICONS[insight.kind]} size={15} strokeWidth={2} />
                </span>
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
