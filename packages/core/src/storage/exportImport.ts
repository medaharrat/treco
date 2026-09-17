import type { UsageEvent } from "../types.js";
import { assertPrivacySafe, USAGE_EVENT_ALLOWED_KEYS } from "../privacy/guard.js";

export interface ExportBundle {
  exportedAt: string;
  version: 1;
  events: UsageEvent[];
}

export function exportEventsAsJSON(events: UsageEvent[]): string {
  const bundle: ExportBundle = {
    exportedAt: new Date().toISOString(),
    version: 1,
    events
  };
  return JSON.stringify(bundle, null, 2);
}

const CSV_COLUMNS = Array.from(USAGE_EVENT_ALLOWED_KEYS) as Array<keyof UsageEvent>;

export function exportEventsAsCSV(events: UsageEvent[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = events.map((e) =>
    CSV_COLUMNS.map((col) => {
      const value = e[col];
      if (Array.isArray(value)) return `"${value.join(";")}"`;
      return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : String(value);
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

export function parseImportedJSON(raw: string): UsageEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const events = Array.isArray(parsed) ? parsed : (parsed as ExportBundle)?.events;
  if (!Array.isArray(events)) {
    throw new Error("Expected an array of events (or an export bundle with an events array)");
  }

  for (const event of events) {
    assertPrivacySafe(event);
  }

  return events as UsageEvent[];
}
