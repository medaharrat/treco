import { useMemo } from "react";
import { computePeriodStats, computeStatsForRange, periodRange, previousPeriodRange, type Period, type UsageEvent } from "@ai-footprint/core";

export function usePeriodStats(events: UsageEvent[], period: Period, referenceDate: Date = new Date()) {
  return useMemo(() => computePeriodStats(events, period, referenceDate), [events, period, referenceDate]);
}

export function usePreviousPeriodStats(events: UsageEvent[], period: Period, referenceDate: Date = new Date()) {
  return useMemo(() => {
    const range = previousPeriodRange(period, referenceDate);
    return computeStatsForRange(events, range, period);
  }, [events, period, referenceDate]);
}

export function useTrend(current: number, previous: number): { pct: number; direction: "up" | "down" | "flat" } | null {
  return useMemo(() => {
    if (previous <= 0) return null;
    const change = (current - previous) / previous;
    if (Math.abs(change) < 0.01) return { pct: 0, direction: "flat" };
    return { pct: Math.round(Math.abs(change) * 100), direction: change > 0 ? "up" : "down" };
  }, [current, previous]);
}

export { periodRange };
