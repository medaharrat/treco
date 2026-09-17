import { describe, it, expect } from "vitest";
import { computePeriodStats, computeTimeSeries, activeDaysInLastNDays } from "../src/aggregation/stats.js";
import { periodRange, previousPeriodRange } from "../src/aggregation/period.js";
import { buildUsageEvent } from "../src/events/build.js";
import type { UsageEventCandidate } from "../src/events/candidate.js";

function candidate(overrides: Partial<UsageEventCandidate> & { timestamp: number }): UsageEventCandidate {
  return {
    provider: "chatgpt",
    model: "gpt-4o",
    inputTokens: 100,
    outputTokens: 200,
    tokenMethod: "estimated",
    ...overrides
  };
}

describe("periodRange", () => {
  it("produces a 24h day range", () => {
    const ref = new Date("2026-03-15T14:00:00");
    const range = periodRange("day", ref);
    expect(range.end - range.start).toBe(24 * 60 * 60 * 1000);
  });

  it("produces a 7-day week range starting Monday", () => {
    const ref = new Date("2026-03-18T10:00:00"); // a Wednesday
    const range = periodRange("week", ref);
    const start = new Date(range.start);
    expect(start.getDay()).toBe(1); // Monday
    expect(range.end - range.start).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("previous week range does not overlap the current week range", () => {
    const ref = new Date("2026-03-18T10:00:00");
    const current = periodRange("week", ref);
    const prev = previousPeriodRange("week", ref);
    expect(prev.end).toBeLessThanOrEqual(current.start);
  });
});

describe("computePeriodStats", () => {
  it("returns zeroed stats for an empty event list", () => {
    const stats = computePeriodStats([], "week", new Date("2026-03-18T10:00:00"));
    expect(stats.interactionCount).toBe(0);
    expect(stats.totalTokens).toBe(0);
    expect(stats.topProvider).toBeNull();
  });

  it("aggregates totals, provider breakdown and top provider correctly", () => {
    const ref = new Date("2026-03-18T10:00:00");
    const events = [
      buildUsageEvent(candidate({ provider: "chatgpt", model: "gpt-4o", timestamp: ref.getTime() - 1000 })),
      buildUsageEvent(candidate({ provider: "claude", model: "claude-sonnet", timestamp: ref.getTime() - 2000 })),
      buildUsageEvent(candidate({ provider: "chatgpt", model: "gpt-4o", timestamp: ref.getTime() - 3000 }))
    ];

    const stats = computePeriodStats(events, "week", ref);
    expect(stats.interactionCount).toBe(3);
    expect(stats.totalTokens).toBe(3 * 300);
    expect(stats.providerCount).toBe(2);
    expect(stats.topProvider).toBe("chatgpt");
    expect(stats.providerBreakdown[0]?.share).toBeCloseTo(2 / 3, 5);
  });

  it("excludes events outside the requested range", () => {
    const ref = new Date("2026-03-18T10:00:00");
    const farAway = buildUsageEvent(candidate({ timestamp: ref.getTime() - 30 * 24 * 60 * 60 * 1000 }));
    const stats = computePeriodStats([farAway], "week", ref);
    expect(stats.interactionCount).toBe(0);
  });
});

describe("computeTimeSeries", () => {
  it("gap-fills days with no usage", () => {
    const ref = new Date("2026-03-18T00:00:00").getTime();
    const events = [buildUsageEvent(candidate({ timestamp: ref }))];
    const series = computeTimeSeries(events, { granularity: "day", from: ref - 3 * 86400000, to: ref });
    expect(series.length).toBe(4);
    expect(series.filter((p) => p.interactionCount === 0).length).toBe(3);
    expect(series.at(-1)?.interactionCount).toBe(1);
  });
});

describe("activeDaysInLastNDays", () => {
  it("counts distinct calendar days, not events", () => {
    const ref = new Date("2026-03-18T12:00:00");
    const events = [
      buildUsageEvent(candidate({ timestamp: ref.getTime() })),
      buildUsageEvent(candidate({ timestamp: ref.getTime() - 60 * 60 * 1000 })), // same day
      buildUsageEvent(candidate({ timestamp: ref.getTime() - 26 * 60 * 60 * 1000 })) // previous day
    ];
    expect(activeDaysInLastNDays(events, 30, ref)).toBe(2);
  });
});
