/**
 * Converts abstract energy figures into everyday comparisons. Every constant
 * here is a documented, order-of-magnitude assumption - shown to the user
 * alongside the comparison so it's never presented as more precise than it is.
 */

export const COMPARISON_ASSUMPTIONS = {
  /** Typical smartphone battery capacity, in watt-hours (e.g. a modern phone is roughly 11-15 Wh). */
  smartphoneChargeWh: 12,
  /** Typical laptop power draw while in active use, in watts. */
  laptopActiveWatts: 50,
  /** Typical LED bulb power draw, in watts. */
  ledBulbWatts: 9
} as const;

export interface EnergyComparison {
  smartphoneCharges: number;
  laptopHours: number;
  ledBulbHours: number;
}

export function compareEnergy(wh: number): EnergyComparison {
  const safeWh = Math.max(0, wh);
  return {
    smartphoneCharges: safeWh / COMPARISON_ASSUMPTIONS.smartphoneChargeWh,
    laptopHours: safeWh / COMPARISON_ASSUMPTIONS.laptopActiveWatts,
    ledBulbHours: safeWh / COMPARISON_ASSUMPTIONS.ledBulbWatts
  };
}

/**
 * Picks the single most legible comparison sentence for a given energy value,
 * choosing the scale (seconds of a lightbulb, a fraction of a phone charge,
 * a number of full charges, or laptop-hours) that actually reads as a real
 * quantity at that magnitude - "0.0 smartphone charges" is technically
 * correct but communicates nothing, so very small amounts get a smaller unit
 * instead of a tiny fraction of a big one.
 */
export function primaryComparisonSentence(wh: number): string {
  if (wh <= 0) return "No AI energy use recorded yet for this period.";

  const c = compareEnergy(wh);
  const ledBulbSeconds = c.ledBulbHours * 3600;

  if (ledBulbSeconds < 60) {
    const seconds = Math.max(1, Math.round(ledBulbSeconds));
    return `roughly as much electricity as running an LED bulb for ${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  if (c.smartphoneCharges < 0.1) {
    const percent = Math.max(1, Math.round(c.smartphoneCharges * 100));
    return `roughly ${percent}% of a full smartphone charge`;
  }

  if (c.laptopHours >= 1) {
    return `roughly as much electricity as running a laptop for ${formatNumber(c.laptopHours)} hours`;
  }

  return `roughly as much electricity as charging a smartphone ${formatNumber(c.smartphoneCharges)} times`;
}

function formatNumber(n: number): string {
  if (n >= 100) return Math.round(n).toString();
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
