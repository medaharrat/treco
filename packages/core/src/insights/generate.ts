import type { Insight, UsageEvent } from "../types.js";
import { computeStatsForRange, activeDaysInLastNDays } from "../aggregation/stats.js";
import { periodRange, previousPeriodRange } from "../aggregation/period.js";
import { getProviderById } from "../providers/registry.js";

/**
 * Generates neutral, non-judgmental insights from locally stored data.
 * Language deliberately avoids "wasted"/"should" framing - see docs/METHODOLOGY.md.
 */
export function generateInsights(events: UsageEvent[], referenceDate: Date = new Date()): Insight[] {
  const insights: Insight[] = [];

  const thisWeek = computeStatsForRange(events, periodRange("week", referenceDate), "week");
  const lastWeek = computeStatsForRange(events, previousPeriodRange("week", referenceDate), "week");
  const thisMonth = computeStatsForRange(events, periodRange("month", referenceDate), "month");

  // Week-over-week trend.
  if (lastWeek.totalTokens > 0) {
    const change = (thisWeek.totalTokens - lastWeek.totalTokens) / lastWeek.totalTokens;
    if (Math.abs(change) >= 0.15) {
      const pct = Math.round(Math.abs(change) * 100);
      insights.push({
        id: "trend-week",
        kind: change > 0 ? "trend-up" : "trend-down",
        message:
          change > 0
            ? `Your estimated AI usage this week is about ${pct}% higher than last week.`
            : `Your estimated AI usage this week is about ${pct}% lower than last week.`,
        data: { changePct: pct, direction: change > 0 ? 1 : -1 }
      });
    }
  }

  // Top contributor this month.
  if (thisMonth.providerBreakdown.length > 1 && thisMonth.providerBreakdown[0]) {
    const top = thisMonth.providerBreakdown[0];
    if (top.share >= 0.4) {
      const providerName = getProviderById(top.provider)?.name ?? top.provider;
      insights.push({
        id: "top-contributor-month",
        kind: "top-contributor",
        message: `${providerName} accounts for most of your estimated footprint this month (about ${Math.round(top.share * 100)}%).`,
        data: { provider: top.provider, sharePct: Math.round(top.share * 100) }
      });
    }
  }

  // Output-heavy usage (responses dominate the token count).
  if (thisWeek.totalTokens > 0) {
    const outputShare = thisWeek.outputTokens / thisWeek.totalTokens;
    const lastWeekOutputShare = lastWeek.totalTokens > 0 ? lastWeek.outputTokens / lastWeek.totalTokens : null;
    if (outputShare >= 0.7 && (lastWeekOutputShare === null || outputShare - lastWeekOutputShare >= 0.1)) {
      insights.push({
        id: "output-heavy-week",
        kind: "output-heavy",
        message: "Your output-token usage increased as a share of your total usage this week. Longer responses tend to use more estimated energy than longer prompts.",
        data: { outputSharePct: Math.round(outputShare * 100) }
      });
    }
  }

  // Active-days streak.
  const activeDays = activeDaysInLastNDays(events, 30, referenceDate);
  if (activeDays > 0) {
    insights.push({
      id: "active-days-30",
      kind: "streak",
      message: `You used AI on ${activeDays} of the last 30 days.`,
      data: { activeDays }
    });
  }

  // Optimization suggestion, only when clearly supported by the data.
  if (thisWeek.totalTokens > 0 && thisWeek.outputTokens / thisWeek.totalTokens >= 0.75) {
    insights.push({
      id: "optimization-shorter-outputs",
      kind: "optimization",
      message:
        "A large share of this week's usage comes from long responses. Requesting more concise answers when appropriate may reduce estimated inference energy.",
    });
  }

  return insights;
}
