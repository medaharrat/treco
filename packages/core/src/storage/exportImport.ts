import type { UsageEvent } from "../types.js";
import { assertPrivacySafe, USAGE_EVENT_ALLOWED_KEYS } from "../privacy/guard.js";
import { MAX_STORED_EVENTS } from "./StorageAdapter.js";

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

/**
 * Spreadsheet apps (Excel, Google Sheets, LibreOffice) treat a cell starting
 * with =, +, -, @, tab, or CR as a formula. None of Treco's own fields are
 * ever attacker-controlled free text, but `model` is read from a supported
 * AI page's rendered DOM - so if a page ever rendered a hostile-looking
 * string there, this stops it from executing as a formula when the CSV is
 * later opened in a spreadsheet ("CSV injection").
 */
const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

function csvCell(value: unknown): string {
  if (Array.isArray(value)) {
    return `"${value.join(";")}"`;
  }
  if (typeof value !== "string") {
    return String(value);
  }
  const safe = FORMULA_TRIGGER_CHARS.has(value[0] ?? "") ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportEventsAsCSV(events: UsageEvent[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = events.map((e) => CSV_COLUMNS.map((col) => csvCell(e[col])).join(","));
  return [header, ...rows].join("\n");
}

/** Hard ceiling on how large an imported JSON file's raw text may be, before it's even parsed. */
const MAX_IMPORT_TEXT_LENGTH = 25 * 1024 * 1024; // 25 MB of JSON text

export function parseImportedJSON(raw: string): UsageEvent[] {
  if (raw.length > MAX_IMPORT_TEXT_LENGTH) {
    throw new Error("Import file is too large");
  }

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
  if (events.length > MAX_STORED_EVENTS) {
    throw new Error(`Import contains too many events (max ${MAX_STORED_EVENTS.toLocaleString()})`);
  }

  for (const event of events) {
    assertPrivacySafe(event);
  }

  return events as UsageEvent[];
}
