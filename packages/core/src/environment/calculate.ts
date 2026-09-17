import type { FootprintEstimate, ModelFootprintProfile } from "../types.js";
import { resolveProfile, type ProfileLookup } from "./resolveProfile.js";

export interface CalculateFootprintInput {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface CalculateFootprintOptions extends ProfileLookup {
  /** Lets the user override the assumed grid carbon intensity in Settings. */
  carbonIntensityOverrideGPerKwh?: number | null;
}

/**
 * The single place tokens become an environmental estimate:
 *   tokens -> IT-equipment energy -> facility energy (via PUE) -> CO2e (via carbon intensity) and water (via WUE)
 */
export function calculateFootprint(
  input: CalculateFootprintInput,
  options: CalculateFootprintOptions = {}
): FootprintEstimate {
  const profile = resolveProfile(input.provider, input.model, options);
  return calculateFootprintWithProfile(input, profile, options);
}

export function calculateFootprintWithProfile(
  input: CalculateFootprintInput,
  profile: ModelFootprintProfile,
  options: CalculateFootprintOptions = {}
): FootprintEstimate {
  const inputTokens = Math.max(0, input.inputTokens);
  const outputTokens = Math.max(0, input.outputTokens);

  const itEnergyWh =
    profile.whPerRequest !== undefined
      ? profile.whPerRequest
      : inputTokens * (profile.inputWhPerToken ?? 0) + outputTokens * (profile.outputWhPerToken ?? 0);

  const facilityEnergyWh = itEnergyWh * profile.pue;
  const facilityEnergyKwh = facilityEnergyWh / 1000;

  const carbonIntensity = options.carbonIntensityOverrideGPerKwh ?? profile.carbonIntensityGPerKwh;

  const co2eGrams = facilityEnergyKwh * carbonIntensity;
  const waterMl = facilityEnergyKwh * profile.waterMlPerKwh;

  const energyWhRange: [number, number] = [
    facilityEnergyWh * profile.uncertaintyRange.lowerMultiplier,
    facilityEnergyWh * profile.uncertaintyRange.upperMultiplier
  ];

  return {
    energyWh: facilityEnergyWh,
    energyWhRange,
    co2eGrams,
    waterMl,
    confidence: profile.confidence,
    profileId: profile.id,
    isFallback: profile.isFallback
  };
}
