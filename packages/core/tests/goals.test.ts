import { describe, it, expect } from "vitest";
import { computeGoalProgress, createGoal } from "../src/goals/progress.js";
import { buildUsageEvent } from "../src/events/build.js";

describe("goals", () => {
  it("creates a goal with an id and timestamp", () => {
    const goal = createGoal({ metric: "energyWh", period: "weekly", target: 10 });
    expect(goal.id).toBeTruthy();
    expect(goal.createdAt).toBeGreaterThan(0);
  });

  it("computes progress ratio against current usage", () => {
    const ref = new Date("2026-03-18T12:00:00");
    const goal = createGoal({ metric: "totalTokens", period: "weekly", target: 1000 });
    const events = [
      buildUsageEvent({ provider: "chatgpt", model: "gpt-4o", inputTokens: 200, outputTokens: 300, tokenMethod: "estimated", timestamp: ref.getTime() })
    ];
    const progress = computeGoalProgress(goal, events, ref);
    expect(progress.current).toBe(500);
    expect(progress.ratio).toBeCloseTo(0.5, 5);
  });

  it("reports zero progress with no usage", () => {
    const ref = new Date("2026-03-18T12:00:00");
    const goal = createGoal({ metric: "co2eGrams", period: "monthly", target: 5 });
    const progress = computeGoalProgress(goal, [], ref);
    expect(progress.current).toBe(0);
    expect(progress.ratio).toBe(0);
    expect(progress.onTrack).toBe(true);
  });
});
