import React, { useState } from "react";
import type { Period } from "@ai-footprint/core";
import { getProviderById } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { usePeriodStats, usePreviousPeriodStats, useTrend } from "../hooks/usePeriodStats.js";
import { Card } from "../components/Card.js";
import { PeriodTabs } from "../components/PeriodTabs.js";
import { StatTile } from "../components/StatTile.js";
import { TrendBadge } from "../components/TrendBadge.js";
import { ComparisonNote } from "../components/ComparisonNote.js";
import { EmptyState } from "../components/EmptyState.js";
import { BarList } from "../components/BarList.js";
import { formatCount, formatEnergy, formatMass, formatVolume } from "../format.js";
import { MiniTimeline } from "../components/MiniTimeline.js";

export function DashboardPage({ compact = false }: { compact?: boolean }) {
  const { events, settings, loading } = useStorage();
  const [period, setPeriod] = useState<Period>("week");

  const stats = usePeriodStats(events, period);
  const prevStats = usePreviousPeriodStats(events, period);
  const tokenTrend = useTrend(stats.totalTokens, prevStats.totalTokens);

  if (loading) {
    return (
      <div className="af-flex-col af-gap-3">
        <div className="af-skeleton" style={{ height: 28, width: 180 }} />
        <div className="af-skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  const hasAnyEvents = events.length > 0;

  return (
    <div>
      {!compact && (
        <div className="af-row af-mb-3">
          <div>
            <h1 className="af-h1">AI Footprint</h1>
            <p className="af-subtitle" style={{ margin: 0 }}>
              Your AI usage, estimated locally. Nothing you write is ever sent anywhere.
            </p>
          </div>
        </div>
      )}

      <div className="af-row af-mb-3">
        <PeriodTabs value={period} onChange={setPeriod} options={compact ? ["day", "week"] : ["day", "week", "month", "all"]} />
        {tokenTrend && <TrendBadge pct={tokenTrend.pct} direction={tokenTrend.direction} />}
      </div>

      {!hasAnyEvents ? (
        <Card>
          <EmptyState
            icon="leaf"
            title="No AI usage recorded yet"
            description="Visit a supported AI website (like ChatGPT or Claude) with monitoring enabled, and your usage will start appearing here."
          />
        </Card>
      ) : (
        <>
          <Card>
            <div className="af-stat-grid">
              <StatTile large value={formatCount(stats.totalTokens)} label="tokens" />
              <StatTile large value={formatEnergy(stats.energyWh)} label="estimated energy" />
              <StatTile large value={formatMass(stats.co2eGrams, settings.units)} label="estimated CO2e" />
              <StatTile large value={formatVolume(stats.waterMl, settings.units)} label="estimated water" />
            </div>
            <ComparisonNote energyWh={stats.energyWh} />
          </Card>

          {!compact && (
            <Card>
              <h2 className="af-h2">Over time</h2>
              <MiniTimeline events={events} period={period} />
            </Card>
          )}

          <Card>
            <div className="af-row af-mb-3">
              <h2 className="af-h2" style={{ margin: 0 }}>
                Providers
              </h2>
              <span className="af-muted" style={{ fontSize: 12.5 }}>
                {stats.providerCount} used
              </span>
            </div>
            <BarList
              items={stats.providerBreakdown.slice(0, compact ? 3 : undefined).map((p) => ({
                key: p.provider,
                label: getProviderById(p.provider)?.name ?? p.provider,
                share: p.share,
                color: getProviderById(p.provider)?.color
              }))}
            />
          </Card>

          {!compact && (
            <Card>
              <div className="af-row">
                <StatTile value={String(stats.interactionCount)} label="interactions" />
                <StatTile value={formatCount(stats.inputTokens)} label="input tokens" />
                <StatTile value={formatCount(stats.outputTokens)} label="output tokens" />
                <StatTile value={stats.topProvider ? getProviderById(stats.topProvider)?.name ?? stats.topProvider : "-"} label="most-used provider" />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
