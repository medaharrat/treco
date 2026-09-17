import { describe, it, expect, beforeEach } from "vitest";
import type { AIProviderAdapter } from "@ai-footprint/core";
import { chatgptAdapter } from "../src/adapters/providers/chatgpt.js";
import { claudeAdapter } from "../src/adapters/providers/claude.js";
import { geminiAdapter } from "../src/adapters/providers/gemini.js";
import { copilotAdapter } from "../src/adapters/providers/copilot.js";
import { deepseekAdapter } from "../src/adapters/providers/deepseek.js";
import { perplexityAdapter } from "../src/adapters/providers/perplexity.js";
import { grokAdapter } from "../src/adapters/providers/grok.js";
import { mistralAdapter } from "../src/adapters/providers/mistral.js";
import { poeAdapter } from "../src/adapters/providers/poe.js";
import { characteraiAdapter } from "../src/adapters/providers/characterai.js";
import { loadFixture, withHost } from "./harness.js";

interface Case {
  adapter: AIProviderAdapter;
  hostname: string;
  fixture: string;
}

const CASES: Case[] = [
  { adapter: chatgptAdapter, hostname: "chatgpt.com", fixture: "chatgpt" },
  { adapter: claudeAdapter, hostname: "claude.ai", fixture: "claude" },
  { adapter: geminiAdapter, hostname: "gemini.google.com", fixture: "gemini" },
  { adapter: copilotAdapter, hostname: "copilot.microsoft.com", fixture: "copilot" },
  { adapter: deepseekAdapter, hostname: "chat.deepseek.com", fixture: "deepseek" },
  { adapter: perplexityAdapter, hostname: "www.perplexity.ai", fixture: "perplexity" },
  { adapter: grokAdapter, hostname: "grok.com", fixture: "grok" },
  { adapter: mistralAdapter, hostname: "chat.mistral.ai", fixture: "mistral" },
  { adapter: poeAdapter, hostname: "poe.com", fixture: "poe" },
  { adapter: characteraiAdapter, hostname: "character.ai", fixture: "characterai" }
];

for (const { adapter, hostname, fixture } of CASES) {
  describe(`${adapter.name} adapter`, () => {
    beforeEach(() => {
      document.body.innerHTML = loadFixture(fixture);
    });

    it("declares its own id and at least one domain", () => {
      expect(adapter.id).toBeTruthy();
      expect(adapter.domains.length).toBeGreaterThan(0);
      expect(adapter.domains).toContain(hostname);
    });

    it("detects its own domain", () => {
      withHost(hostname, () => {
        expect(adapter.detect()).toBe(true);
      });
    });

    it("does not detect an unrelated domain", () => {
      withHost("example.com", () => {
        expect(adapter.detect()).toBe(false);
      });
    });

    it("extracts a usage event from the fixture, tagged as estimated or inferred (never exact)", () => {
      withHost(hostname, () => {
        const event = adapter.extractUsage();
        expect(event).not.toBeNull();
        expect(event?.provider).toBe(adapter.id);
        expect(event && event.outputTokens).toBeGreaterThan(0);
        expect(["estimated", "inferred"]).toContain(event?.tokenMethod);
        expect(event && event.energyWh).toBeGreaterThan(0);
        expect(event && event.co2eGrams).toBeGreaterThan(0);
      });
    });
  });
}

describe("provider domain isolation", () => {
  it("no two adapters claim the same domain", () => {
    const seen = new Map<string, string>();
    for (const { adapter } of CASES) {
      for (const domain of adapter.domains) {
        const owner = seen.get(domain);
        if (owner && owner !== adapter.id) {
          throw new Error(`Domain ${domain} is claimed by both ${owner} and ${adapter.id}`);
        }
        seen.set(domain, adapter.id);
      }
    }
  });
});
