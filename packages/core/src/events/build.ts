import type { UsageEvent } from "../types.js";
import { generateId } from "../util/id.js";
import { calculateFootprint, type CalculateFootprintOptions } from "../environment/calculate.js";
import type { UsageEventCandidate } from "./candidate.js";

/**
 * Turns a validated candidate into a fully-formed, storable UsageEvent by
 * running the environmental calculation engine. This is the only place a
 * UsageEvent is constructed, so every event in storage is guaranteed to have
 * been through validation + calculation, never hand-assembled ad hoc.
 */
export function buildUsageEvent(candidate: UsageEventCandidate, options: CalculateFootprintOptions = {}): UsageEvent {
  const totalTokens = candidate.inputTokens + candidate.outputTokens;
  const footprint = calculateFootprint(
    {
      provider: candidate.provider,
      model: candidate.model,
      inputTokens: candidate.inputTokens,
      outputTokens: candidate.outputTokens
    },
    options
  );

  return {
    id: generateId(),
    provider: candidate.provider,
    model: candidate.model,
    timestamp: candidate.timestamp ?? Date.now(),
    inputTokens: candidate.inputTokens,
    outputTokens: candidate.outputTokens,
    totalTokens,
    tokenMethod: candidate.tokenMethod,
    energyWh: footprint.energyWh,
    energyWhRange: footprint.energyWhRange,
    co2eGrams: footprint.co2eGrams,
    waterMl: footprint.waterMl,
    confidence: footprint.confidence,
    profileId: footprint.profileId
  };
}
