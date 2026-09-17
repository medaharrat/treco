import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getProviderById, type Period } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { usePeriodStats } from "../hooks/usePeriodStats.js";
import { Card } from "../components/Card.js";
import { PeriodTabs } from "../components/PeriodTabs.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatCount, formatEnergy, formatMass, formatVolume } from "../format.js";

export function ProvidersPage() {
  const { events, settings } = useStorage();
  const [period, setPeriod] = useState<Period>("month");
  const stats = usePeriodStats(events, period);

  return (
    <div>
      <h1 className="af-h1">Providers</h1>
      <p className="af-subtitle">How your usage splits across the AI products you use.</p>
      <PeriodTabs value={period} onChange={setPeriod} />

      <Card className="af-mt-4">
        {stats.providerBreakdown.length === 0 ? (
          <EmptyState title="No provider usage yet" description="Once you use a supported AI website, its share of your usage will show up here." />
        ) : (
          <div className="af-flex-col af-gap-3">
            {stats.providerBreakdown.map((p) => {
              const def = getProviderById(p.provider);
              return (
                <Link key={p.provider} to={`/providers/${p.provider}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="af-card-sm af-card" style={{ boxShadow: "none" }}>
                    <div className="af-row">
                      <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="af-bar-dot" style={{ background: def?.color ?? "var(--af-accent)" }} />
                        {def?.name ?? p.provider}
                      </span>
                      <span className="af-muted" style={{ fontSize: 13 }}>
                        {Math.round(p.share * 100)}%
                      </span>
                    </div>
                    <div className="af-row af-mt-2" style={{ fontSize: 12.5 }}>
                      <span className="af-muted">{formatCount(p.totalTokens)} tokens</span>
                      <span className="af-muted">{formatEnergy(p.energyWh)}</span>
                      <span className="af-muted">{formatMass(p.co2eGrams, settings.units)}</span>
                      <span className="af-muted">{formatVolume(p.waterMl, settings.units)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
