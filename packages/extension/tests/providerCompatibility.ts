import { expect, it } from "vitest";
import type { AIProviderAdapter } from "@ai-footprint/core";
import { loadFixture, withHost } from "./harness.js";

/**
 * Reusable compatibility checklist for any provider adapter. Adding a new
 * provider means adding one fixture HTML file and one call to this function
 * in a test file - the same checks every existing adapter is held to run
 * automatically for the new one too.
 */
export function runProviderCompatibilitySuite(adapter: AIProviderAdapter, hostname: string, fixtureName: string) {
  it(`[${adapter.id}] declares a non-empty id, name and domain list`, () => {
    expect(adapter.id.length).toBeGreaterThan(0);
    expect(adapter.name.length).toBeGreaterThan(0);
    expect(adapter.domains.length).toBeGreaterThan(0);
  });

  it(`[${adapter.id}] detects only its own domain`, () => {
    withHost(hostname, () => expect(adapter.detect()).toBe(true));
    withHost("not-a-real-ai-site.invalid", () => expect(adapter.detect()).toBe(false));
  });

  it(`[${adapter.id}] extracts a plausible, honestly-labeled usage event from its fixture`, () => {
    document.body.innerHTML = loadFixture(fixtureName);
    withHost(hostname, () => {
      const event = adapter.extractUsage();
      expect(event).not.toBeNull();
      if (!event) return;
      expect(event.provider).toBe(adapter.id);
      expect(event.tokenMethod).not.toBe("exact"); // no supported provider exposes real counts in the browser today
      expect(Number.isFinite(event.energyWh)).toBe(true);
      expect(event.energyWh).toBeGreaterThanOrEqual(0);
      expect(event.confidence).toMatch(/^(high|medium|low)$/);
    });
  });

  it(`[${adapter.id}] survives a page with unrecognized markup via the generic fallback`, () => {
    document.body.innerHTML = `<div>${"Unrecognized future markup with plausible response-length text. ".repeat(10)}</div>`;
    withHost(hostname, () => {
      // Even if every structured selector fails to match here, extractUsage
      // should not throw - the shared factory's generic fallback should
      // still produce SOME estimate (or a clean null), never an exception.
      expect(() => adapter.extractUsage()).not.toThrow();
    });
  });
}
