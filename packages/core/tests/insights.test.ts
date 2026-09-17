import { describe, it, expect } from "vitest";
import { generateInsights } from "../src/insights/generate.js";
import { buildUsageEvent } from "../src/events/build.js";
import type { UsageEventCandidate } from "../src/events/candidate.js";

function candidate(overrides: Partial<UsageEventCandidate> & { timestamp: number }): UsageEventCandidate {
  return {
    provider: "chatgpt",
    model: "gpt-4o",
    inputTokens: 50,
    outputTokens: 500,
    tokenMethod: "estimated",
    ...overrides
  };
}

describe("generateInsights", () => {
  it("returns no insights for no data", () => {
    expect(generateInsights([], new Date("2026-03-18T12:00:00"))).toEqual([]);
  });

  it("flags a week-over-week increase", () => {
    const ref = new Date("2026-03-18T12:00:00"); // Wednesday, this week Mon 03-16 to Mon 03-23
    const lastWeekRef = new Date("2026-03-11T12:00:00"); // previous Wednesday
    const events = [
      // last week: a few small events
      buildUsageEvent(candidate({ timestamp: lastWeekRef.getTime(), inputTokens: 10, outputTokens: 10 })),
      // this week: much larger usage
      buildUsageEvent(candidate({ timestamp: ref.getTime(), inputTokens: 1000, outputTokens: 1000 })),
      buildUsageEvent(candidate({ timestamp: ref.getTime() - 1000, inputTokens: 1000, outputTokens: 1000 }))
    ];
    const insights = generateInsights(events, ref);
    expect(insights.some((i) => i.kind === "trend-up")).toBe(true);
  });

  it("never uses shaming language like 'wasted'", () => {
    const ref = new Date("2026-03-18T12:00:00");
    const events = Array.from({ length: 10 }, (_, i) =>
      buildUsageEvent(candidate({ timestamp: ref.getTime() - i * 3600_000, outputTokens: 2000 }))
    );
    const insights = generateInsights(events, ref);
    for (const insight of insights) {
      expect(insight.message.toLowerCase()).not.toContain("waste");
      expect(insight.message.toLowerCase()).not.toContain("should");
    }
  });

  it("reports active days over the last 30 days", () => {
    const ref = new Date("2026-03-18T12:00:00");
    const events = [buildUsageEvent(candidate({ timestamp: ref.getTime() }))];
    const insights = generateInsights(events, ref);
    const streak = insights.find((i) => i.kind === "streak");
    expect(streak?.data?.activeDays).toBe(1);
  });
});
