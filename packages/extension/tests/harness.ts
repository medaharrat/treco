import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";

export function loadFixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", `${name}.html`), "utf-8");
}

/** Runs `fn` with `location.hostname` stubbed, restoring it afterwards. */
export function withHost<T>(hostname: string, fn: () => T): T {
  vi.stubGlobal("location", { hostname } as Location);
  try {
    return fn();
  } finally {
    vi.unstubAllGlobals();
  }
}
