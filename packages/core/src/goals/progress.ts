import type { Goal, GoalProgress, UsageEvent } from "../types.js";
import { computePeriodStats } from "../aggregation/stats.js";
import { generateId } from "../util/id.js";

const METRIC_PERIOD_MAP = {
  weekly: "week",
  monthly: "month"
} as const;

export function computeGoalProgress(goal: Goal, events: UsageEvent[], referenceDate: Date = new Date()): GoalProgress {
  const stats = computePeriodStats(events, METRIC_PERIOD_MAP[goal.period], referenceDate);
  const current = stats[goal.metric];
  const ratio = goal.target > 0 ? current / goal.target : 0;

  // "On track" is a light-touch, non-judgmental signal: are we proportionally
  // where we'd expect to be through the period so far?
  const periodRange = computePeriodStats(events, METRIC_PERIOD_MAP[goal.period], referenceDate);
  const elapsedRatio = Math.min(
    1,
    (referenceDate.getTime() - periodRange.rangeStart) / (periodRange.rangeEnd - periodRange.rangeStart)
  );
  const onTrack = ratio <= Math.max(elapsedRatio, 0.05) + 0.15;

  return { goal, current, ratio, onTrack };
}

export function createGoal(input: Omit<Goal, "id" | "createdAt">): Goal {
  return { ...input, id: generateId(), createdAt: Date.now() };
}
