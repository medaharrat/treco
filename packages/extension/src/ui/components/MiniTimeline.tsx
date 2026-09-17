import React, { useMemo } from "react";
import { computeTimeSeries, periodRange, type Period, type UsageEvent } from "@ai-footprint/core";
import { LineChart } from "./LineChart.js";
import { formatCount, formatDateLabel } from "../format.js";

const GRANULARITY_FOR_PERIOD: Record<Period, "day" | "week" | "month"> = {
  day: "day",
  week: "day",
  month: "day",
  year: "month",
  all: "month"
};

export function MiniTimeline({ events, period }: { events: UsageEvent[]; period: Period }) {
  const series = useMemo(() => {
    const granularity = GRANULARITY_FOR_PERIOD[period];
    const now = Date.now();
    const from =
      period === "all"
        ? Math.min(now, ...events.map((e) => e.timestamp), now - 1000 * 60 * 60 * 24 * 30)
        : periodRange(period === "day" ? "month" : period, new Date()).start;
    return computeTimeSeries(events, { granularity, from, to: now });
  }, [events, period]);

  const points = series.map((p) => ({ x: p.bucketStart, y: p.tokens, label: formatDateLabel(p.bucketStart, GRANULARITY_FOR_PERIOD[period]) }));

  return <LineChart points={points} valueFormatter={(n) => `${formatCount(n)} tokens`} />;
}
