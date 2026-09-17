import React, { useMemo, useState } from "react";
import { computeTimeSeries, getProviderById, PROVIDER_REGISTRY, type TimeSeriesGranularity } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Card } from "../components/Card.js";
import { LineChart } from "../components/LineChart.js";
import { BarList } from "../components/BarList.js";
import { Icon } from "../components/Icons.js";
import { formatCount, formatDateLabel, formatEnergy, formatMass, formatVolume } from "../format.js";

type Metric = "tokens" | "energyWh" | "co2eGrams" | "waterMl" | "interactionCount";

const METRIC_LABELS: Record<Metric, string> = {
  tokens: "Tokens",
  energyWh: "Energy",
  co2eGrams: "CO2e",
  waterMl: "Water",
  interactionCount: "Requests"
};

const GRANULARITY_OPTIONS: Array<{ value: TimeSeriesGranularity; label: string; lookbackDays: number }> = [
  { value: "day", label: "Day", lookbackDays: 30 },
  { value: "week", label: "Week", lookbackDays: 90 },
  { value: "month", label: "Month", lookbackDays: 365 }
];

export function HistoryPage() {
  const { events, settings } = useStorage();
  const [metric, setMetric] = useState<Metric>("tokens");
  const [granularity, setGranularity] = useState<TimeSeriesGranularity>("day");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (providerFilter === "all" ? events : events.filter((e) => e.provider === providerFilter)),
    [events, providerFilter]
  );

  const lookbackDays = GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.lookbackDays ?? 30;

  const series = useMemo(() => {
    const now = Date.now();
    const from = now - 1000 * 60 * 60 * 24 * lookbackDays;
    return computeTimeSeries(filtered, { granularity, from, to: now });
  }, [filtered, granularity, lookbackDays]);

  const points = series.map((p) => ({ x: p.bucketStart, y: p[metric], label: formatDateLabel(p.bucketStart, granularity) }));

  const valueFormatter = (n: number) => {
    if (metric === "energyWh") return formatEnergy(n);
    if (metric === "co2eGrams") return formatMass(n, settings.units);
    if (metric === "waterMl") return formatVolume(n, settings.units);
    if (metric === "interactionCount") return `${Math.round(n)} requests`;
    return `${formatCount(n)} tokens`;
  };

  const providerTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filtered) totals.set(e.provider, (totals.get(e.provider) ?? 0) + e.totalTokens);
    const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(totals.entries())
      .map(([provider, tokens]) => ({ key: provider, label: getProviderById(provider)?.name ?? provider, share: tokens / sum, color: getProviderById(provider)?.color }))
      .sort((a, b) => b.share - a.share);
  }, [filtered]);

  return (
    <div>
      <h1 className="af-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="clock" size={19} strokeWidth={2} />
        History &amp; Insights
      </h1>
      <p className="af-subtitle">Trends in your estimated AI footprint over time.</p>

      <Card>
        <div className="af-row af-mb-3">
          <div className="af-tabs">
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <button key={m} className={`af-tab ${metric === m ? "active" : ""}`} onClick={() => setMetric(m)}>
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="af-tabs">
            {GRANULARITY_OPTIONS.map((g) => (
              <button key={g.value} className={`af-tab ${granularity === g.value ? "active" : ""}`} onClick={() => setGranularity(g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="af-field" style={{ maxWidth: 220 }}>
          <label htmlFor="provider-filter">Filter by provider</label>
          <select id="provider-filter" className="af-select" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">All providers</option>
            {PROVIDER_REGISTRY.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <LineChart points={points} valueFormatter={valueFormatter} height={200} />
      </Card>

      <Card>
        <h2 className="af-h2">Provider distribution</h2>
        <BarList items={providerTotals} />
      </Card>
    </div>
  );
}
