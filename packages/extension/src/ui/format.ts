import type { ExtensionSettings } from "@ai-footprint/core";

/** Formats a token/interaction count without false precision: 2.8M, 340K, 128. */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${trimDecimal(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trimDecimal(n / 1_000)}K`;
  return Math.round(n).toString();
}

function trimDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

export function formatEnergy(wh: number): string {
  if (wh >= 1000) return `${(wh / 1000).toFixed(wh / 1000 >= 10 ? 1 : 2)} kWh`;
  if (wh >= 10) return `${wh.toFixed(0)} Wh`;
  return `${wh.toFixed(1)} Wh`;
}

export function formatMass(grams: number, units: ExtensionSettings["units"] = "metric"): string {
  if (units === "imperial") {
    const lb = grams / 453.592;
    if (lb < 0.1) return `${(grams / 28.3495).toFixed(2)} oz`;
    return `${lb.toFixed(lb >= 10 ? 1 : 2)} lb`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams / 1000 >= 10 ? 1 : 2)} kg`;
  return `${Math.round(grams)} g`;
}

export function formatVolume(ml: number, units: ExtensionSettings["units"] = "metric"): string {
  if (units === "imperial") {
    const flOz = ml / 29.5735;
    if (flOz >= 128) return `${(flOz / 128).toFixed(1)} gal`;
    return `${flOz.toFixed(flOz >= 10 ? 0 : 1)} fl oz`;
  }
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml / 1000 >= 10 ? 1 : 2)} L`;
  return `${Math.round(ml)} mL`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatDateLabel(timestamp: number, granularity: "day" | "week" | "month"): string {
  const d = new Date(timestamp);
  if (granularity === "month") return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
