import React, { useState } from "react";
import { getProviderById, type Period } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { usePeriodStats } from "../hooks/usePeriodStats.js";
import { Card } from "../components/Card.js";
import { PeriodTabs } from "../components/PeriodTabs.js";
import { BarList } from "../components/BarList.js";
import { EmptyState } from "../components/EmptyState.js";
import { ConfidenceBadge } from "../components/ConfidenceBadge.js";
import { formatCount, formatEnergy } from "../format.js";

export function ModelsPage() {
  const { events } = useStorage();
  const [period, setPeriod] = useState<Period>("month");
  const stats = usePeriodStats(events, period);

  return (
    <div>
      <h1 className="af-h1">Models</h1>
      <p className="af-subtitle">Which models are behind your estimated footprint.</p>
      <PeriodTabs value={period} onChange={setPeriod} />

      <Card className="af-mt-4">
        {stats.modelBreakdown.length === 0 ? (
          <EmptyState title="No model usage yet" description="Model-level usage will appear here once you've used an AI product." />
        ) : (
          <BarList
            items={stats.modelBreakdown.map((m) => ({
              key: `${m.provider}::${m.model}`,
              label: `${m.model}`,
              share: m.share,
              color: getProviderById(m.provider)?.color
            }))}
          />
        )}
      </Card>

      {stats.modelBreakdown.length > 0 && (
        <Card>
          <h2 className="af-h2">Detail</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--af-text-secondary)" }}>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>Model</th>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>Provider</th>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>Tokens</th>
                <th style={{ padding: "6px 0", fontWeight: 500 }}>Energy</th>
              </tr>
            </thead>
            <tbody>
              {stats.modelBreakdown.map((m) => (
                <tr key={`${m.provider}::${m.model}`} style={{ borderTop: "1px solid var(--af-border-soft)" }}>
                  <td style={{ padding: "8px 0", fontWeight: 600 }}>{m.model}</td>
                  <td style={{ padding: "8px 0" }} className="af-muted">
                    {getProviderById(m.provider)?.name ?? m.provider}
                  </td>
                  <td style={{ padding: "8px 0" }}>{formatCount(m.totalTokens)}</td>
                  <td style={{ padding: "8px 0" }}>{formatEnergy(m.energyWh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="af-muted af-mt-3" style={{ fontSize: 12 }}>
            Figures are estimates. See <ConfidenceBadge confidence="medium" /> and the Settings → Environmental methodology page for
            how they're calculated.
          </p>
        </Card>
      )}
    </div>
  );
}
