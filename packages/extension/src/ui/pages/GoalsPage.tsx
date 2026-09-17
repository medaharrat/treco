import React, { useMemo, useState } from "react";
import { computeGoalProgress, createGoal, type Goal, type GoalMetric, type GoalPeriod } from "@ai-footprint/core";
import { useStorage } from "../state/StorageContext.js";
import { Card } from "../components/Card.js";
import { CircularProgress } from "../components/CircularProgress.js";
import { EmptyState } from "../components/EmptyState.js";
import { Icon } from "../components/Icons.js";
import { formatEnergy, formatMass, formatVolume, formatCount } from "../format.js";

const METRIC_OPTIONS: Array<{ value: GoalMetric; label: string }> = [
  { value: "energyWh", label: "Energy (Wh)" },
  { value: "co2eGrams", label: "CO2e (g)" },
  { value: "waterMl", label: "Water (mL)" },
  { value: "totalTokens", label: "Tokens" }
];

function formatMetricValue(metric: GoalMetric, value: number, units: "metric" | "imperial") {
  switch (metric) {
    case "energyWh":
      return formatEnergy(value);
    case "co2eGrams":
      return formatMass(value, units);
    case "waterMl":
      return formatVolume(value, units);
    case "totalTokens":
      return formatCount(value);
  }
}

export function GoalsPage() {
  const { events, goals, setGoals, settings } = useStorage();
  const [metric, setMetric] = useState<GoalMetric>("energyWh");
  const [period, setPeriod] = useState<GoalPeriod>("weekly");
  const [target, setTarget] = useState<string>("");

  const progresses = useMemo(() => goals.map((g) => computeGoalProgress(g, events)), [goals, events]);

  function addGoal() {
    const targetNum = Number(target);
    if (!Number.isFinite(targetNum) || targetNum <= 0) return;
    const goal = createGoal({ metric, period, target: targetNum });
    void setGoals([...goals, goal]);
    setTarget("");
  }

  function removeGoal(id: string) {
    void setGoals(goals.filter((g: Goal) => g.id !== id));
  }

  return (
    <div>
      <h1 className="af-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="target" size={19} strokeWidth={2} />
        Goals
      </h1>
      <p className="af-subtitle">Optional, informational targets - not a scoreboard. Nothing here is meant to guilt you.</p>

      <Card>
        {goals.length === 0 ? (
          <EmptyState icon="target" title="No goals set" description="Set an optional weekly or monthly target below to track progress toward it." />
        ) : (
          <div className="af-flex-col af-gap-4">
            {progresses.map(({ goal, current, ratio }) => (
              <div key={goal.id} className="af-row" style={{ alignItems: "center", gap: 16 }}>
                <CircularProgress ratio={ratio} label={`${Math.round(ratio * 100)}%`} />
                <div style={{ flex: 1 }}>
                  <div className="af-row af-mb-2">
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {goal.period === "weekly" ? "Weekly" : "Monthly"} goal - {METRIC_OPTIONS.find((m) => m.value === goal.metric)?.label}
                    </span>
                    <button className="af-btn af-btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => removeGoal(goal.id)}>
                      Remove
                    </button>
                  </div>
                  <p className="af-muted" style={{ fontSize: 12.5, margin: 0 }}>
                    You've used {formatMetricValue(goal.metric, current, settings.units)} / {formatMetricValue(goal.metric, goal.target, settings.units)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="af-h2">
          <Icon name="sprout" size={15} strokeWidth={2} />
          Add a goal
        </h2>
        <div className="af-field">
          <label htmlFor="goal-metric">Metric</label>
          <select id="goal-metric" className="af-select" value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
            {METRIC_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="af-field">
          <label htmlFor="goal-period">Period</label>
          <select id="goal-period" className="af-select" value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="af-field">
          <label htmlFor="goal-target">Target</label>
          <input id="goal-target" className="af-input" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 10" />
        </div>
        <button className="af-btn af-btn-primary" onClick={addGoal}>
          Add goal
        </button>
      </Card>
    </div>
  );
}
