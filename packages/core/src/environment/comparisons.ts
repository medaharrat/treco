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
 * Picks the single most legible comparison sentence for a given energy value.
 * Prefers laptop-hours for larger values (weekly/monthly totals) and
 * smartphone charges for smaller ones (a single session), since those read
 * more naturally at different magnitudes.
 */
export function primaryComparisonSentence(wh: number): string {
  const c = compareEnergy(wh);
  if (wh <= 0) return "No AI energy use recorded yet for this period.";
  if (c.laptopHours >= 1) {
    return `roughly as much electricity as running a laptop for ${formatNumber(c.laptopHours)} hours`;
  }
  return `roughly as much electricity as charging a smartphone ${formatNumber(c.smartphoneCharges)} times`;
}

function formatNumber(n: number): string {
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(1);
}
