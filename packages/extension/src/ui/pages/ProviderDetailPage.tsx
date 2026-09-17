import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeTimeSeries, getProviderById, type Period } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { usePeriodStats } from "../hooks/usePeriodStats.js";
import { Card } from "../components/Card.js";
import { PeriodTabs } from "../components/PeriodTabs.js";
import { StatTile } from "../components/StatTile.js";
import { BarList } from "../components/BarList.js";
import { LineChart } from "../components/LineChart.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatCount, formatDateLabel, formatEnergy, formatMass, formatVolume } from "../format.js";

export function ProviderDetailPage() {
  const { providerId = "" } = useParams();
  const { events, settings } = useStorage();
  const [period, setPeriod] = useState<Period>("month");

  const providerEvents = useMemo(() => events.filter((e) => e.provider === providerId), [events, providerId]);
  const stats = usePeriodStats(providerEvents, period);
  const def = getProviderById(providerId);

  const series = useMemo(() => {
    const now = Date.now();
    const from = now - 1000 * 60 * 60 * 24 * 30;
    return computeTimeSeries(providerEvents, { granularity: "day", from, to: now }).map((p) => ({
      x: p.bucketStart,
      y: p.energyWh,
      label: formatDateLabel(p.bucketStart, "day")
    }));
  }, [providerEvents]);

  if (!def) {
    return (
      <Card>
        <EmptyState title="Unknown provider" description="This provider isn't in the registry." />
      </Card>
    );
  }

  return (
    <div>
      <Link to="/providers" className="af-muted" style={{ fontSize: 12.5, textDecoration: "none" }}>
        ← All providers
      </Link>
      <h1 className="af-h1 af-mt-2">{def.name}</h1>
      <p className="af-subtitle">{def.description}</p>

      <PeriodTabs value={period} onChange={setPeriod} />

      <Card className="af-mt-4">
        <div className="af-stat-grid">
          <StatTile large value={formatCount(stats.totalTokens)} label="Tokens" />
          <StatTile large value={formatEnergy(stats.energyWh)} label="Estimated Energy" />
          <StatTile large value={formatMass(stats.co2eGrams, settings.units)} label="Estimated CO2 Emissions" />
          <StatTile large value={formatVolume(stats.waterMl, settings.units)} label="Estimated Water Usage" />
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">Usage, last 30 days</h2>
        <LineChart points={series} valueFormatter={(n) => formatEnergy(n)} />
      </Card>

      <Card>
        <h2 className="af-h2">Models</h2>
        <BarList
          items={stats.modelBreakdown.map((m) => ({ key: m.model, label: m.model, share: m.share, color: def.color }))}
        />
      </Card>
    </div>
  );
}
