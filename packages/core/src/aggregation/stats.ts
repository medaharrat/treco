import type { PeriodStats, Period, UsageEvent } from "../types.js";
import { isWithinRange, periodRange, type Range } from "./period.js";

export function filterEventsInRange(events: UsageEvent[], range: Range): UsageEvent[] {
  return events.filter((e) => isWithinRange(e.timestamp, range));
}

export function filterEvents(
  events: UsageEvent[],
  opts: { provider?: string; model?: string } = {}
): UsageEvent[] {
  return events.filter((e) => {
    if (opts.provider && e.provider !== opts.provider) return false;
    if (opts.model && e.model !== opts.model) return false;
    return true;
  });
}

function emptyStats(period: Period, range: Range): PeriodStats {
  return {
    period,
    rangeStart: range.start,
    rangeEnd: range.end,
    interactionCount: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    energyWh: 0,
    co2eGrams: 0,
    waterMl: 0,
    providerCount: 0,
    topProvider: null,
    topModel: null,
    providerBreakdown: [],
    modelBreakdown: []
  };
}

export function computePeriodStats(
  events: UsageEvent[],
  period: Period,
  referenceDate: Date = new Date()
): PeriodStats {
  return computeStatsForRange(events, periodRange(period, referenceDate), period);
}

export function computeStatsForRange(events: UsageEvent[], range: Range, period: Period): PeriodStats {
  const inRange = filterEventsInRange(events, range);
  if (inRange.length === 0) return emptyStats(period, range);

  let totalTokens = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let energyWh = 0;
  let co2eGrams = 0;
  let waterMl = 0;

  const byProvider = new Map<string, { totalTokens: number; energyWh: number; co2eGrams: number; waterMl: number }>();
  const byModel = new Map<string, { provider: string; model: string; totalTokens: number; energyWh: number; co2eGrams: number; waterMl: number }>();

  for (const e of inRange) {
    totalTokens += e.totalTokens;
    inputTokens += e.inputTokens;
    outputTokens += e.outputTokens;
    energyWh += e.energyWh;
    co2eGrams += e.co2eGrams;
    waterMl += e.waterMl;

    const p = byProvider.get(e.provider) ?? { totalTokens: 0, energyWh: 0, co2eGrams: 0, waterMl: 0 };
    p.totalTokens += e.totalTokens;
    p.energyWh += e.energyWh;
    p.co2eGrams += e.co2eGrams;
    p.waterMl += e.waterMl;
    byProvider.set(e.provider, p);

    const modelKey = `${e.provider}::${e.model}`;
    const m = byModel.get(modelKey) ?? { provider: e.provider, model: e.model, totalTokens: 0, energyWh: 0, co2eGrams: 0, waterMl: 0 };
    m.totalTokens += e.totalTokens;
    m.energyWh += e.energyWh;
    m.co2eGrams += e.co2eGrams;
    m.waterMl += e.waterMl;
    byModel.set(modelKey, m);
  }

  const providerBreakdown = Array.from(byProvider.entries())
    .map(([provider, v]) => ({ provider, share: totalTokens > 0 ? v.totalTokens / totalTokens : 0, ...v }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  const modelBreakdown = Array.from(byModel.values())
    .map((v) => ({ ...v, share: totalTokens > 0 ? v.totalTokens / totalTokens : 0 }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  return {
    period,
    rangeStart: range.start,
    rangeEnd: range.end,
    interactionCount: inRange.length,
    totalTokens,
    inputTokens,
    outputTokens,
    energyWh,
    co2eGrams,
    waterMl,
    providerCount: byProvider.size,
    topProvider: providerBreakdown[0]?.provider ?? null,
    topModel: modelBreakdown[0] ? `${modelBreakdown[0].model}` : null,
    providerBreakdown,
    modelBreakdown
  };
}

export type TimeSeriesGranularity = "day" | "week" | "month";

export interface TimeSeriesOptions {
  granularity: TimeSeriesGranularity;
  from: number;
  to: number;
}

export interface TimeSeriesPointOut {
  bucketStart: number;
  tokens: number;
  energyWh: number;
  co2eGrams: number;
  waterMl: number;
  interactionCount: number;
}

function bucketStartFor(timestamp: number, granularity: TimeSeriesGranularity): number {
  const d = new Date(timestamp);
  if (granularity === "day") {
    d.setHours(0, 0, 0, 0);
  } else if (granularity === "week") {
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

/** Buckets events into a dense (gap-filled) time series for charting. */
export function computeTimeSeries(events: UsageEvent[], options: TimeSeriesOptions): TimeSeriesPointOut[] {
  const buckets = new Map<number, TimeSeriesPointOut>();

  for (const e of events) {
    if (e.timestamp < options.from || e.timestamp > options.to) continue;
    const bucketStart = bucketStartFor(e.timestamp, options.granularity);
    const existing = buckets.get(bucketStart) ?? {
      bucketStart,
      tokens: 0,
      energyWh: 0,
      co2eGrams: 0,
      waterMl: 0,
      interactionCount: 0
    };
    existing.tokens += e.totalTokens;
    existing.energyWh += e.energyWh;
    existing.co2eGrams += e.co2eGrams;
    existing.waterMl += e.waterMl;
    existing.interactionCount += 1;
    buckets.set(bucketStart, existing);
  }

  // Gap-fill so the chart shows zero-days rather than skipping them.
  const points: TimeSeriesPointOut[] = [];
  let cursor = bucketStartFor(options.from, options.granularity);
  const end = bucketStartFor(options.to, options.granularity);
  const step = (d: number) => {
    const dt = new Date(d);
    if (options.granularity === "day") dt.setDate(dt.getDate() + 1);
    else if (options.granularity === "week") dt.setDate(dt.getDate() + 7);
    else dt.setMonth(dt.getMonth() + 1);
    return dt.getTime();
  };

  let iterations = 0;
  while (cursor <= end && iterations < 2000) {
    points.push(buckets.get(cursor) ?? { bucketStart: cursor, tokens: 0, energyWh: 0, co2eGrams: 0, waterMl: 0, interactionCount: 0 });
    cursor = step(cursor);
    iterations += 1;
  }

  return points;
}

/** Number of distinct calendar days with at least one interaction in the last N days (inclusive of today). */
export function activeDaysInLastNDays(events: UsageEvent[], n: number, referenceDate: Date = new Date()): number {
  const cutoff = new Date(referenceDate);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (n - 1));
  const cutoffMs = cutoff.getTime();

  const days = new Set<string>();
  for (const e of events) {
    if (e.timestamp < cutoffMs) continue;
    const d = new Date(e.timestamp);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return days.size;
}
